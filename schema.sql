-- Proyecto: WatchList Personal
-- Tema: control de series, peliculas y animes vistos, pendientes y puntuados.

create extension if not exists "pgcrypto";

create type public.title_type as enum ('serie', 'pelicula', 'anime');
create type public.watch_status as enum ('pendiente', 'viendo', 'visto', 'abandonado');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.app_admins (
  email text primary key,
  username text not null,
  created_at timestamptz not null default now()
);

create table public.genres (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.titles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title_type public.title_type not null,
  synopsis text,
  release_year integer check (release_year is null or release_year between 1888 and 2100),
  cover_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, title_type, release_year)
);

create table public.title_genres (
  title_id uuid not null references public.titles(id) on delete cascade,
  genre_id uuid not null references public.genres(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (title_id, genre_id)
);

create table public.user_watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title_id uuid not null references public.titles(id) on delete cascade,
  status public.watch_status not null default 'pendiente',
  rating integer check (rating is null or rating between 1 and 10),
  progress_text text,
  watched_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, title_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title_id uuid not null references public.titles(id) on delete cascade,
  rating integer not null check (rating between 1 and 10),
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, title_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.review_likes (
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_admins
    where lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger titles_set_updated_at
before update on public.titles
for each row execute function public.set_updated_at();

create trigger user_watchlist_set_updated_at
before update on public.user_watchlist
for each row execute function public.set_updated_at();

create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

create trigger comments_set_updated_at
before update on public.comments
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
begin
  base_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  final_username := base_username;

  if exists (select 1 from public.profiles where username = final_username) then
    final_username := base_username || '_' || left(replace(new.id::text, '-', ''), 6);
  end if;

  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.app_admins enable row level security;
alter table public.genres enable row level security;
alter table public.titles enable row level security;
alter table public.title_genres enable row level security;
alter table public.user_watchlist enable row level security;
alter table public.reviews enable row level security;
alter table public.comments enable row level security;
alter table public.review_likes enable row level security;

create policy "profiles are readable by everyone"
on public.profiles for select
using (true);

create policy "users update their own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "admins are readable by authenticated users"
on public.app_admins for select
to authenticated
using (true);

create policy "genres are readable by everyone"
on public.genres for select
using (true);

create policy "authenticated users create genres"
on public.genres for insert
to authenticated
with check (auth.uid() = created_by);

create policy "genre creator updates genre"
on public.genres for update
to authenticated
using (auth.uid() = created_by or public.is_app_admin())
with check (auth.uid() = created_by or public.is_app_admin());

create policy "genre creator deletes genre"
on public.genres for delete
to authenticated
using (auth.uid() = created_by or public.is_app_admin());

create policy "titles are readable by everyone"
on public.titles for select
using (true);

create policy "authenticated users create titles"
on public.titles for insert
to authenticated
with check (auth.uid() = created_by);

create policy "title creator updates title"
on public.titles for update
to authenticated
using (auth.uid() = created_by or public.is_app_admin())
with check (auth.uid() = created_by or public.is_app_admin());

create policy "title creator deletes title"
on public.titles for delete
to authenticated
using (auth.uid() = created_by or public.is_app_admin());

create policy "title genres are readable by everyone"
on public.title_genres for select
using (true);

create policy "authenticated users connect titles and genres"
on public.title_genres for insert
to authenticated
with check (auth.uid() = created_by);

create policy "relation creator deletes title genre"
on public.title_genres for delete
to authenticated
using (auth.uid() = created_by or public.is_app_admin());

create policy "users read only their own watchlist"
on public.user_watchlist for select
to authenticated
using (auth.uid() = user_id);

create policy "users add titles to their own watchlist"
on public.user_watchlist for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users update their own watchlist"
on public.user_watchlist for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users delete from their own watchlist"
on public.user_watchlist for delete
to authenticated
using (auth.uid() = user_id);

create policy "reviews are readable by everyone"
on public.reviews for select
using (true);

create policy "authenticated users create their own reviews"
on public.reviews for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users update their own reviews"
on public.reviews for update
to authenticated
using (auth.uid() = user_id or public.is_app_admin())
with check (auth.uid() = user_id or public.is_app_admin());

create policy "users delete their own reviews"
on public.reviews for delete
to authenticated
using (auth.uid() = user_id or public.is_app_admin());

create policy "comments are readable by everyone"
on public.comments for select
using (true);

create policy "authenticated users create their own comments"
on public.comments for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users update their own comments"
on public.comments for update
to authenticated
using (auth.uid() = user_id or public.is_app_admin())
with check (auth.uid() = user_id or public.is_app_admin());

create policy "users delete their own comments"
on public.comments for delete
to authenticated
using (auth.uid() = user_id or public.is_app_admin());

create policy "likes are readable by everyone"
on public.review_likes for select
using (true);

create policy "authenticated users like reviews as themselves"
on public.review_likes for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users remove their own likes"
on public.review_likes for delete
to authenticated
using (auth.uid() = user_id or public.is_app_admin());

insert into public.genres (name)
values
  ('Accion'),
  ('Aventura'),
  ('Comedia'),
  ('Drama'),
  ('Fantasia'),
  ('Terror'),
  ('Ciencia ficcion'),
  ('Romance'),
  ('Suspenso')
on conflict (name) do nothing;

insert into public.app_admins (email, username)
values ('tylornoa@gmail.com', 'Noa12')
on conflict (email) do update
set username = excluded.username;

alter table public.comments replica identity full;
alter table public.user_watchlist replica identity full;
alter table public.review_likes replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'titles'
  ) then
    alter publication supabase_realtime add table public.titles;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'comments'
  ) then
    alter publication supabase_realtime add table public.comments;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_watchlist'
  ) then
    alter publication supabase_realtime add table public.user_watchlist;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'review_likes'
  ) then
    alter publication supabase_realtime add table public.review_likes;
  end if;
end $$;

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "cover images are public"
on storage.objects for select
using (bucket_id = 'covers');

create policy "authenticated users upload covers"
on storage.objects for insert
to authenticated
with check (bucket_id = 'covers');

create policy "authenticated users update covers"
on storage.objects for update
to authenticated
using (bucket_id = 'covers')
with check (bucket_id = 'covers');

create policy "avatar images are public"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "authenticated users upload their avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "authenticated users update their avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
