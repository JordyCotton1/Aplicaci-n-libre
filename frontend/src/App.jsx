import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BookOpen,
  CheckCircle2,
  Film,
  LogOut,
  MessageSquare,
  Monitor,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
  User,
  WandSparkles,
  X
} from 'lucide-react';
import { supabase } from './lib/supabase';

const titleTypes = ['serie', 'pelicula', 'anime'];
const statuses = ['pendiente', 'viendo', 'visto', 'abandonado'];
const moderatorEmail = 'tylornoa@gmail.com';
const moderatorUsername = 'Noa12';
const siteUrl = 'https://watchlist-anime.netlify.app/';

const emptyTitle = {
  name: '',
  title_type: 'serie',
  release_year: '',
  synopsis: '',
  genre_id: '',
  other_genre: '',
  cover: null,
  cover_url: ''
};

const avatarUrl = 'https://api.dicebear.com/8.x/adventurer/svg?seed=noa&backgroundColor=1e1b4b';

const demoTitles = [
  {
    id: 'demo-attack',
    demo: true,
    name: 'Attack on Titan',
    title_type: 'serie',
    release_year: 2013,
    synopsis: 'La humanidad lucha por sobrevivir detras de murallas gigantes mientras descubre verdades ocultas.',
    cover_url: 'https://images.unsplash.com/photo-1601850494422-3cf14624b0b3?auto=format&fit=crop&w=600&q=80',
    title_genres: [{ genre_id: 'demo-action', genres: { name: 'Acción, Drama' } }]
  },
  {
    id: 'demo-demon',
    demo: true,
    name: 'Demon Slayer',
    title_type: 'serie',
    release_year: 2019,
    synopsis: 'Tanjiro busca salvar a su hermana mientras pelea contra demonios.',
    cover_url: 'https://images.unsplash.com/photo-1612404730960-5c71577fca11?auto=format&fit=crop&w=600&q=80',
    title_genres: [{ genre_id: 'demo-fantasy', genres: { name: 'Acción, Fantasía' } }]
  },
  {
    id: 'demo-fma',
    demo: true,
    name: 'Fullmetal Alchemist: Brotherhood',
    title_type: 'serie',
    release_year: 2009,
    synopsis: 'Dos hermanos alquimistas buscan recuperar lo que perdieron.',
    cover_url: 'https://images.unsplash.com/photo-1628498188904-036f5e25e93e?auto=format&fit=crop&w=600&q=80',
    title_genres: [{ genre_id: 'demo-adventure', genres: { name: 'Acción, Aventura' } }]
  },
  {
    id: 'demo-jujutsu',
    demo: true,
    name: 'Jujutsu Kaisen',
    title_type: 'serie',
    release_year: 2020,
    synopsis: 'Hechiceros enfrentan maldiciones nacidas de emociones humanas.',
    cover_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
    title_genres: [{ genre_id: 'demo-supernatural', genres: { name: 'Acción, Sobrenatural' } }]
  },
  {
    id: 'demo-your-name',
    demo: true,
    name: 'Your Name',
    title_type: 'pelicula',
    release_year: 2016,
    synopsis:
      'Mitsuha, una chica que quiere vivir en Tokio, y Taki, un chico que vive en la ciudad, descubren que intercambian sus cuerpos de forma inesperada.',
    cover_url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=80',
    title_genres: [{ genre_id: 'demo-romance', genres: { name: 'Romance, Drama' } }]
  }
];

const demoReviews = [
  {
    id: 'demo-review-1',
    rating: 10,
    body: 'Una obra maestra. La animacion y la historia son simplemente hermosas.',
    profiles: { username: 'noa' }
  },
  {
    id: 'demo-review-2',
    rating: 9,
    body: 'Me hizo llorar. Muy recomendada.',
    profiles: { username: 'Sakura_chan' }
  }
];

const demoWatchlist = [
  { id: 'demo-w1', status: 'viendo', rating: 9, titles: { ...demoTitles[3], name: 'Death Note' } },
  { id: 'demo-w2', status: 'viendo', rating: 9, titles: { ...demoTitles[1], name: 'One Piece' } },
  { id: 'demo-w3', status: 'visto', rating: 10, titles: { ...demoTitles[0], name: 'Naruto Shippuden' } },
  { id: 'demo-w4', status: 'abandonado', rating: 8, titles: { ...demoTitles[2], name: 'Tokyo Ghoul' } },
  { id: 'demo-w5', status: 'pendiente', rating: 9, titles: { ...demoTitles[4], name: 'Violet Evergarden' } }
];

function normalizePublicStorageUrl(url) {
  if (!url) return '';
  return url.replace('/storage/v1/object/avatars/', '/storage/v1/object/public/avatars/');
}

function formatRelativeDate(createdAt, updatedAt) {
  const created = createdAt ? new Date(createdAt) : null;
  const updated = updatedAt ? new Date(updatedAt) : null;
  const date =
    updated && created && updated > created ? updated :
    updated || created;

  if (!date || Number.isNaN(date.getTime())) return 'Hoy';

  const today = new Date();
  const createdDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.floor((todayDay - createdDay) / 86400000);

  if (diffDays <= 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  return `Hace ${diffDays} días`;
}

export function App() {
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', username: '' });
  const [profile, setProfile] = useState(null);
  const [genres, setGenres] = useState([]);
  const [titles, setTitles] = useState([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [filters, setFilters] = useState({ search: '', type: 'todos', genre: 'todos' });
  const [titleForm, setTitleForm] = useState(emptyTitle);
  const [editingTitle, setEditingTitle] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 10, body: '' });
  const [commentText, setCommentText] = useState('');
  const [activeTab, setActiveTab] = useState('reviews');
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [showWatchPanel, setShowWatchPanel] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [refreshingCatalog, setRefreshingCatalog] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const user = session?.user ?? null;

  useEffect(() => {
    let active = true;

    async function loadSession() {
    // Reviso si Supabase ya tiene una sesión guardada para mantener al usuario conectado al recargar.
      const { data } = await supabase.auth.getSession();
      if (active) {
        setSession(data.session);
        setLoading(false);
      }
    }

    loadSession();

    // Me suscribo a los cambios de autenticacion para actualizar la pantalla cuando el usuario entra o sale.
    const { data } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setWatchlist([]);
      return;
    }

    loadProfile();
    loadWatchlist();
  }, [user?.id]);

  useEffect(() => {
    loadCatalogData();
  }, []);

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        closeDetail();
      }
    }

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    // Escucho títulos nuevos en el catálogo para avisar cuando otro usuario agrega algo.
    const channel = supabase
      .channel('catalog-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'titles' },
        (payload) => {
          const newTitle = payload.new;
          if (newTitle.created_by !== user.id) {
            setNotifications((current) => [
              {
                id: `${newTitle.id}-${Date.now()}`,
                text: `Nuevo título en el catálogo: ${newTitle.name}`,
                createdAt: new Date().toLocaleTimeString()
              },
              ...current
            ].slice(0, 8));
            setMessage(`Nuevo título agregado al catálogo: ${newTitle.name}`);
          }
          loadCatalogData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!selectedTitle) {
      setReviews([]);
      setComments([]);
      setLikes([]);
      return;
    }

    if (selectedTitle.demo) {
      setReviews([]);
      setComments([]);
      setLikes([]);
      return;
    }

    loadTitleActivity(selectedTitle.id);
  }, [selectedTitle?.id]);

  useEffect(() => {
    if (!user) return undefined;

    // Escucho los cambios de mi lista personal para reflejar estados y puntuaciones sin recargar la página.
    const channel = supabase
      .channel(`watchlist-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_watchlist',
          filter: `user_id=eq.${user.id}`
        },
        () => loadWatchlist()
      )
      .subscribe();

    return () => {
      // Quito la suscripcion cuando salgo de esta pantalla para no dejar escuchas duplicadas.
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!selectedTitle) return undefined;

    // Escucho nuevas reseñas y cambios de reseñas para actualizar el detalle del título en vivo.
    const reviewsChannel = supabase
      .channel(`reviews-${selectedTitle.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reviews',
          filter: `title_id=eq.${selectedTitle.id}`
        },
        () => loadTitleActivity(selectedTitle.id)
      )
      .subscribe();

    // Escucho comentarios nuevos o editados para que la conversación de las reseñas se vea al momento.
    const commentsChannel = supabase
      .channel(`comments-${selectedTitle.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        () => loadTitleActivity(selectedTitle.id)
      )
      .subscribe();

    // Escucho likes para actualizar los contadores de me gusta sin pedir otra accion al usuario.
    const likesChannel = supabase
      .channel(`likes-${selectedTitle.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'review_likes' },
        () => loadTitleActivity(selectedTitle.id)
      )
      .subscribe();

    return () => {
    // Quito las suscripciones del detalle para que al cambiar de título no queden canales anteriores activos.
      supabase.removeChannel(reviewsChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(likesChannel);
    };
  }, [selectedTitle?.id]);

  const filteredTitles = useMemo(() => {
    return titles.filter((title) => {
      const searchMatch = title.name.toLowerCase().includes(filters.search.toLowerCase());
      const typeMatch = filters.type === 'todos' || title.title_type === filters.type;
      const genreMatch =
        filters.genre === 'todos' ||
        title.title_genres?.some((item) => item.genre_id === filters.genre);

      return searchMatch && typeMatch && genreMatch;
    });
  }, [titles, filters]);

  const visibleTitles = catalogLoaded ? filteredTitles : [];
  const currentTitle = selectedTitle;
  const visibleReviews = reviews;
  const visibleWatchlist = watchlist;
  const reviewCount = visibleReviews.length;
  const commentCount = comments.length;
  const displayedAvatar = normalizePublicStorageUrl(profile?.avatar_url) || avatarUrl;
  const panelBackground =
    currentTitle?.cover_url ||
    visibleWatchlist.find((item) => item.titles?.cover_url)?.titles?.cover_url ||
    visibleTitles.find((title) => title.cover_url)?.cover_url ||
    demoTitles[4].cover_url;
  const panelBackgroundStyle = panelBackground ? { '--panel-image': `url("${panelBackground}")` } : undefined;
  const isModerator =
    user?.email?.toLowerCase() === moderatorEmail ||
    profile?.username === moderatorUsername;
  const currentWatchItem = currentTitle
    ? watchlist.find((item) => item.title_id === currentTitle.id)
    : null;

  function titleIsInWatchlist(titleId) {
    return watchlist.some((item) => item.title_id === titleId);
  }

  function canManageTitle(title) {
    return Boolean(user && title && (isModerator || title.created_by === user.id));
  }

  function canManageUserContent(ownerId) {
    return Boolean(user && (isModerator || ownerId === user.id));
  }

  function openNewTitleModal() {
    setEditingTitle(null);
    setTitleForm(emptyTitle);
    setShowTitleModal(true);
  }

  function openEditTitleModal(title) {
    setEditingTitle(title);
    setTitleForm({
      name: title.name ?? '',
      title_type: title.title_type ?? 'serie',
      release_year: title.release_year ?? '',
      synopsis: title.synopsis ?? '',
      genre_id: title.title_genres?.[0]?.genre_id ?? '',
      other_genre: '',
      cover: null,
      cover_url: title.cover_url ?? ''
    });
    setShowTitleModal(true);
  }

  function closeTitleModal() {
    setShowTitleModal(false);
    setEditingTitle(null);
    setTitleForm(emptyTitle);
  }

  function updateFilters(nextFilters) {
    setFilters(nextFilters);
    setSelectedTitle(null);
    setActiveTab('reviews');
  }

  function closeDetail() {
    setSelectedTitle(null);
    setActiveTab('reviews');
  }

  const averageRating = useMemo(() => {
    if (visibleReviews.length === 0) return 'Sin nota';
    const total = visibleReviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / visibleReviews.length).toFixed(1);
  }, [visibleReviews]);

  async function loadCatalogData() {
    setRefreshingCatalog(true);
    // Traigo los géneros para llenar filtros y formularios sin escribirlos quemados en el frontend.
    const { data: genreData, error: genreError } = await supabase
      .from('genres')
      .select('*')
      .order('name');

    // Traigo el catálogo con sus géneros para poder filtrar y mostrar la información en una sola vista.
    const { data: titleData, error: titleError } = await supabase
      .from('titles')
      .select('*, title_genres(genre_id, genres(*))')
      .order('created_at', { ascending: false });

    if (genreError || titleError) {
      setMessage(genreError?.message || titleError?.message);
      setCatalogLoaded(true);
      setRefreshingCatalog(false);
      return;
    }

    setGenres(genreData ?? []);
    setTitles(titleData ?? []);
    setCatalogLoaded(true);
    setRefreshingCatalog(false);
  }

  async function loadProfile() {
    // Busco mi perfil para mostrar mi nombre y permitir editar solo mis datos.
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    setProfile(data);
  }

  async function loadWatchlist() {
    if (!user) return;

    // Cargo mi lista personal con la información completa de cada título y sus géneros.
    const { data, error } = await supabase
      .from('user_watchlist')
      .select('*, titles(*, title_genres(genre_id, genres(*)))')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setWatchlist(data ?? []);
  }

  async function loadTitleActivity(titleId) {
    // Cargo las reseñas del título con el perfil del autor para mostrar quién escribió cada opinión.
    const { data: reviewData, error: reviewError } = await supabase
      .from('reviews')
      .select('*, profiles!reviews_user_id_fkey(username, avatar_url)')
      .eq('title_id', titleId)
      .order('created_at', { ascending: false });

    if (reviewError) {
      setMessage(reviewError.message);
      return;
    }

    const reviewIds = (reviewData ?? []).map((review) => review.id);
    setReviews(reviewData ?? []);

    if (reviewIds.length === 0) {
      setComments([]);
      setLikes([]);
      return;
    }

    // Traigo los comentarios de las reseñas visibles para mostrar la conversación completa del título.
    const { data: commentData, error: commentError } = await supabase
      .from('comments')
      .select('*, profiles!comments_user_id_fkey(username)')
      .in('review_id', reviewIds)
      .order('created_at', { ascending: true });

    // Traigo los likes de las reseñas visibles para calcular los contadores y saber si yo ya di like.
    const { data: likeData, error: likeError } = await supabase
      .from('review_likes')
      .select('*')
      .in('review_id', reviewIds);

    if (commentError || likeError) {
      setMessage(commentError?.message || likeError?.message);
      return;
    }

    setComments(commentData ?? []);
    setLikes(likeData ?? []);
  }

  async function handleAuth(event) {
    event.preventDefault();
    setMessage('');

    if (!authForm.email.trim() || !authForm.password.trim()) {
      setMessage('Completa correo y contraseña.');
      return;
    }

    if (authForm.password.length < 8) {
      setMessage('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (authMode === 'register') {
      if (!authForm.username.trim()) {
        setMessage('Completa el nombre de usuario.');
        return;
      }

      // Registro una cuenta nueva y envio el username para que el trigger cree el perfil con ese dato.
      const { error } = await supabase.auth.signUp({
        email: authForm.email,
        password: authForm.password,
        options: {
          emailRedirectTo: siteUrl,
          data: {
            username: authForm.username
          }
        }
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage('Cuenta creada. Revisa tu correo si Supabase pide confirmación.');
      return;
    }

    // Inicio sesión con correo y contraseña para entrar a las secciones protegidas.
    const { error } = await supabase.auth.signInWithPassword({
      email: authForm.email,
      password: authForm.password
    });

    if (error) {
      setMessage(error.message);
    }
  }

  async function handleLogout() {
    // Cierro la sesión activa para ocultar las secciones privadas y limpiar los datos del usuario.
    const { error } = await supabase.auth.signOut();
    if (error) setMessage(error.message);
  }

  async function saveProfile(event) {
    event.preventDefault();

    // Actualizo mi perfil usando mi id para que RLS permita solo modificar mis propios datos.
    const { data, error } = await supabase
      .from('profiles')
      .update({
        username: profile.username,
        full_name: profile.full_name,
        bio: profile.bio
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    setProfile(data);
    setMessage('Perfil guardado.');
  }

  async function uploadAvatar(file) {
    if (!file || !user) return;

    const extension = file.name.split('.').pop();
    const path = `${user.id}/profile-${Date.now()}.${extension}`;

    // Subo mi foto al bucket avatars dentro de mi propia carpeta para que cada usuario controle su imagen.
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file);

    if (uploadError) {
      setMessage(uploadError.message);
      return;
    }

    // Obtengo la URL pública de la foto para guardarla en mi perfil y mostrarla en la interfaz.
    const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path);

    // Guardo la URL de mi avatar en profiles; RLS permite que solo actualice mi propio perfil.
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: publicData.publicUrl })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    setProfile(data);
    setMessage('Foto de perfil actualizada.');
  }

  async function uploadCover(file) {
    if (!file) return null;

    const extension = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${extension}`;

    // Subo la portada al bucket covers para no guardar archivos pesados directamente en la tabla.
    const { error } = await supabase.storage.from('covers').upload(path, file);
    if (error) {
      setMessage(error.message);
      return null;
    }

    // Pido la URL pública del archivo para guardarla en el título y poder mostrar la portada.
    const { data } = supabase.storage.from('covers').getPublicUrl(path);
    return data.publicUrl;
  }

  async function resolveGenreId() {
    if (titleForm.genre_id !== 'other') return titleForm.genre_id;

    const genreName = titleForm.other_genre.trim();

    // Busco si el género escrito ya existe para no duplicarlo.
    const { data: existingGenre, error: selectError } = await supabase
      .from('genres')
      .select('id')
      .ilike('name', genreName)
      .maybeSingle();

    if (selectError) {
      setMessage(selectError.message);
      return null;
    }

    if (existingGenre) return existingGenre.id;

    // Creo un género nuevo para que quede disponible en el catálogo.
    const { data: newGenre, error: insertError } = await supabase
      .from('genres')
      .insert({
        name: genreName,
        created_by: user.id
      })
      .select('id')
      .single();

    if (insertError) {
      setMessage(insertError.message);
      return null;
    }

    return newGenre.id;
  }

  async function createTitle(event) {
    event.preventDefault();
    if (!user) return;

    if (
      !titleForm.name.trim() ||
      !titleForm.title_type ||
      !titleForm.genre_id ||
      (titleForm.genre_id === 'other' && !titleForm.other_genre.trim()) ||
      !titleForm.release_year ||
      !titleForm.synopsis.trim() ||
      (!editingTitle && !titleForm.cover && !titleForm.cover_url.trim())
    ) {
      setMessage('Completa nombre, tipo, género, año, sinopsis y portada antes de guardar.');
      return;
    }

    const coverUrl = titleForm.cover
      ? await uploadCover(titleForm.cover)
      : titleForm.cover_url.trim() || editingTitle?.cover_url;
    if (!coverUrl) return;

    const genreId = await resolveGenreId();
    if (!genreId) return;

    if (editingTitle) {
      // Actualizo el título seleccionado; RLS solo permite esto al creador o al moderador.
      const { data: updatedTitle, error: updateError } = await supabase
        .from('titles')
        .update({
          name: titleForm.name,
          title_type: titleForm.title_type,
          release_year: Number(titleForm.release_year),
          synopsis: titleForm.synopsis,
          cover_url: coverUrl
        })
        .eq('id', editingTitle.id)
        .select('*')
        .single();

      if (updateError) {
        setMessage(updateError.message);
        return;
      }

      // Borro la relación anterior de género para reemplazarla por la elegida en el formulario.
      const { error: deleteGenresError } = await supabase
        .from('title_genres')
        .delete()
        .eq('title_id', editingTitle.id);

      if (deleteGenresError) {
        setMessage(deleteGenresError.message);
        return;
      }

      // Guardo la nueva relación entre el título editado y su género.
      const { error: insertGenreError } = await supabase.from('title_genres').insert({
        title_id: editingTitle.id,
        genre_id: genreId,
        created_by: user.id
      });

      if (insertGenreError) {
        setMessage(insertGenreError.message);
        return;
      }

      setSelectedTitle(updatedTitle);
      setEditingTitle(null);
      setTitleForm(emptyTitle);
      setShowTitleModal(false);
      setMessage('Título actualizado.');
      loadCatalogData();
      return;
    }

    // Inserto un título nuevo en el catálogo con mi usuario como creador para que las políticas sepan quién lo creó.
    const { data: titleData, error: titleError } = await supabase
      .from('titles')
      .insert({
        name: titleForm.name,
        title_type: titleForm.title_type,
        release_year: Number(titleForm.release_year),
        synopsis: titleForm.synopsis,
        cover_url: coverUrl,
        created_by: user.id
      })
      .select()
      .single();

    if (titleError) {
      setMessage(titleError.message);
      return;
    }

    if (titleForm.genre_id) {
      // Relaciono el título con un género para que aparezca en los filtros del catálogo.
      const { error: relationError } = await supabase.from('title_genres').insert({
        title_id: titleData.id,
        genre_id: genreId,
        created_by: user.id
      });

      if (relationError) {
        setMessage(relationError.message);
        return;
      }
    }

    setTitleForm(emptyTitle);
    setShowTitleModal(false);
    setMessage('Título creado.');
    loadCatalogData();
  }

  async function deleteTitle(title) {
    if (!canManageTitle(title)) return;

    // Elimino un título del catálogo; RLS solo permite esto al creador o al moderador.
    const { error } = await supabase
      .from('titles')
      .delete()
      .eq('id', title.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (selectedTitle?.id === title.id) {
      closeDetail();
    }

    setMessage('Título eliminado.');
    loadCatalogData();
    loadWatchlist();
  }

  async function addToWatchlist(title, status = 'pendiente') {
    if (!user) return;

    // Agrego o actualizo un título en mi lista personal para no duplicarlo si ya existía.
    const { error } = await supabase.from('user_watchlist').upsert(
      {
        user_id: user.id,
        title_id: title.id,
        status
      },
      { onConflict: 'user_id,title_id' }
    );

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Lista actualizada.');
    loadWatchlist();
  }

  async function updateWatchItem(item, changes) {
    // Actualizo estado, puntuación o progreso de un título que pertenece a mi lista personal.
    const { error } = await supabase
      .from('user_watchlist')
      .update(changes)
      .eq('id', item.id)
      .eq('user_id', user.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    loadWatchlist();
  }

  async function removeWatchItem(item) {
    // Quito un título de mi lista personal; RLS evita borrar elementos de otros usuarios.
    const { error } = await supabase
      .from('user_watchlist')
      .delete()
      .eq('id', item.id)
      .eq('user_id', user.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    loadWatchlist();
  }

  async function clearWatchlist() {
    if (!user) return;

    // Borro todos los elementos de mi lista personal; RLS impide borrar listas de otros usuarios.
    const { error } = await supabase
      .from('user_watchlist')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Mi lista quedó vacía.');
    loadWatchlist();
  }

  async function createReview(event) {
    event.preventDefault();
    if (!user || !currentTitle) return;

    // Guardo mi reseña del título; uso upsert porque cada usuario solo puede tener una reseña por título.
    const { error } = await supabase.from('reviews').upsert(
      {
        user_id: user.id,
        title_id: currentTitle.id,
        rating: Number(reviewForm.rating),
        body: reviewForm.body
      },
      { onConflict: 'user_id,title_id' }
    );

    if (error) {
      setMessage(error.message);
      return;
    }

    setReviewForm({ rating: 10, body: '' });
    loadTitleActivity(currentTitle.id);
  }

  function editReview(review) {
    setActiveTab('reviews');
    setReviewForm({
      rating: review.rating,
      body: review.body
    });
  }

  async function deleteReview(review) {
    if (!canManageUserContent(review.user_id)) return;

    // Elimino una reseña; RLS solo permite esto al autor o al moderador.
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', review.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Reseña eliminada.');
    loadTitleActivity(currentTitle.id);
  }

  async function addComment(reviewId) {
    if (!user || !commentText.trim()) return;

    // Inserto un comentario mío en una reseña para participar en la conversación del título.
    const { error } = await supabase.from('comments').insert({
      review_id: reviewId,
      user_id: user.id,
      body: commentText
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setCommentText('');
    loadTitleActivity(currentTitle.id);
  }

  async function deleteComment(comment) {
    if (!canManageUserContent(comment.user_id)) return;

    // Elimino un comentario; RLS solo permite esto al autor o al moderador.
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', comment.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Comentario eliminado.');
    loadTitleActivity(currentTitle.id);
  }

  async function toggleLike(reviewId) {
    if (!user) return;

    const alreadyLiked = likes.some((like) => like.review_id === reviewId && like.user_id === user.id);

    if (alreadyLiked) {
      // Quito mi like de esta reseña cuando ya existía uno con mi usuario.
      const { error } = await supabase
        .from('review_likes')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', user.id);

      if (error) setMessage(error.message);
      return;
    }

    // Agrego un like mío a la reseña para que el contador suba en tiempo real.
    const { error } = await supabase.from('review_likes').insert({
      review_id: reviewId,
      user_id: user.id
    });

    if (error) setMessage(error.message);
  }

  if (loading) {
    return <main className="app-shell">Cargando...</main>;
  }

  if (!session) {
    return (
      <main className="auth-page">
        <section className="auth-panel">
          <div className="brand-row">
            <Film size={30} />
            <div>
              <h1>WatchList Personal</h1>
            <p>Series, películas y animes bajo control.</p>
            </div>
          </div>

          <div className="segmented">
            <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>
              Entrar
            </button>
            <button
              className={authMode === 'register' ? 'active' : ''}
              onClick={() => setAuthMode('register')}
            >
              Registro
            </button>
          </div>

          <form onSubmit={handleAuth} className="stack">
            {authMode === 'register' && (
              <label>
                Usuario
                <input
                  value={authForm.username}
                  onChange={(event) => setAuthForm({ ...authForm, username: event.target.value })}
                  placeholder="tu_nombre"
                  required
                  minLength={3}
                />
              </label>
            )}
            <label>
              Correo
              <input
                type="email"
                value={authForm.email}
                onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                required
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                required
                minLength={8}
              />
            </label>
            <button className="primary" type="submit">
              {authMode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </form>
          {message && <p className="notice">{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-row">
          <Film size={28} />
          <div>
            <h1>
              WatchList <span>Anime</span>
            </h1>
            <p>ウォッチリスト</p>
          </div>
        </div>
        <div className="toolbar">
          <div className="user-pill">
            <img src={displayedAvatar} alt="Avatar" />
            <strong>{profile?.username || 'noa'}</strong>
          </div>
          <button
            className={refreshingCatalog ? 'spin-button' : ''}
            onClick={async () => {
              await loadCatalogData();
              setMessage('Catálogo actualizado.');
            }}
            title="Actualizar catálogo"
            disabled={refreshingCatalog}
          >
            <RefreshCw size={18} />
          </button>
          <button
            className="notification-button"
            onClick={() => setNotificationsOpen((open) => !open)}
            title="Notificaciones"
          >
            <Bell size={18} />
            {notifications.length > 0 && <span>{notifications.length}</span>}
          </button>
          {notificationsOpen && (
            <div className="notification-popover">
              <strong>Notificaciones</strong>
              {notifications.length === 0 ? (
                <p>No hay notificaciones nuevas.</p>
              ) : (
                notifications.map((notification) => (
                  <p key={notification.id}>
                    {notification.text}
                    <small>{notification.createdAt}</small>
                  </p>
                ))
              )}
            </div>
          )}
          <button onClick={handleLogout} title="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <section className="layout">
        <aside className="sidebar">
          <form className="panel stack profile-panel" style={panelBackgroundStyle} onSubmit={saveProfile}>
            <h2>
              <User size={18} />
              Perfil
            </h2>
            <label className="avatar-upload">
              <img className="profile-avatar" src={displayedAvatar} alt="Avatar de perfil" />
              <span>
                <Upload size={15} />
                Cambiar foto
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => uploadAvatar(event.target.files?.[0])}
              />
            </label>
            <label>
              Usuario
              <input
                placeholder="noa"
                value={profile?.username ?? ''}
                onChange={(event) => setProfile({ ...(profile ?? {}), username: event.target.value })}
              />
            </label>
            <label>
              Nombre
              <input
                placeholder="Noa Tylor"
                value={profile?.full_name ?? ''}
                onChange={(event) => setProfile({ ...(profile ?? {}), full_name: event.target.value })}
              />
            </label>
            <label>
              Bio
              <textarea
                placeholder="Fanatico del anime, las series y la tecnologia."
                value={profile?.bio ?? ''}
                onChange={(event) => setProfile({ ...(profile ?? {}), bio: event.target.value })}
              />
            </label>
            <button className="primary" type="submit">
              <Save size={17} />
              Guardar
            </button>
          </form>

          <button className="new-title-trigger" type="button" onClick={openNewTitleModal}>
            <Plus size={24} />
            Nuevo título
          </button>

          {showTitleModal && (
            <div className="modal-backdrop" onClick={closeTitleModal}>
          <form className="panel stack title-modal" onSubmit={createTitle} onClick={(event) => event.stopPropagation()}>
            <h2>
              <WandSparkles size={18} />
              {editingTitle ? 'Editar título' : 'Nuevo título'}
            </h2>
            <button className="modal-close" type="button" onClick={closeTitleModal} title="Cerrar">
              <X size={18} />
            </button>
            <label>
              Nombre
              <input
                value={titleForm.name}
                onChange={(event) => setTitleForm({ ...titleForm, name: event.target.value })}
                required
              />
            </label>
            <label>
              Tipo
              <select
                value={titleForm.title_type}
                onChange={(event) => setTitleForm({ ...titleForm, title_type: event.target.value })}
              >
                {titleTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Genero
              <select
                value={titleForm.genre_id}
                onChange={(event) => setTitleForm({ ...titleForm, genre_id: event.target.value })}
                required
              >
                <option value="">Sin género</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.name}
                  </option>
                ))}
                <option value="other">Otro género...</option>
              </select>
            </label>
            {titleForm.genre_id === 'other' && (
              <label>
                Escribe el género
                <input
                  value={titleForm.other_genre}
                  onChange={(event) => setTitleForm({ ...titleForm, other_genre: event.target.value })}
                  placeholder="Ej: Misterio, Musical, Histórico"
                  required
                />
              </label>
            )}
            <label>
              Año
              <input
                type="number"
                value={titleForm.release_year}
                onChange={(event) => setTitleForm({ ...titleForm, release_year: event.target.value })}
                min="1888"
                max="2100"
                required
              />
            </label>
            <label>
              Sinopsis
              <textarea
                value={titleForm.synopsis}
                onChange={(event) => setTitleForm({ ...titleForm, synopsis: event.target.value })}
                required
              />
            </label>
            <div className="cover-options">
              <label className="file-label">
                <Upload size={17} />
                Subir imagen
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setTitleForm({ ...titleForm, cover: event.target.files?.[0] ?? null })}
                />
              </label>
              <label>
                O pegar link de imagen
                <input
                  type="url"
                  value={titleForm.cover_url}
                  onChange={(event) => setTitleForm({ ...titleForm, cover_url: event.target.value })}
                  placeholder="https://ejemplo.com/portada.jpg"
                />
              </label>
            </div>
            <button className="primary" type="submit">
              <Plus size={17} />
              {editingTitle ? 'Guardar cambios' : 'Crear'}
            </button>
          </form>
            </div>
          )}
        </aside>

        <section
          className="content"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeDetail();
            }
          }}
        >
          <p className="notice">
            <Sparkles size={18} />
            {message || 'Lista actualizada correctamente.'}
          </p>
          <button className="watch-toggle" type="button" onClick={() => setShowWatchPanel((show) => !show)}>
            <Star size={18} />
            {showWatchPanel ? 'Ocultar mi lista' : 'Ver mi lista'}
          </button>
          <section className="filters">
            <label className="search-box">
              <Search size={18} />
              <input
                value={filters.search}
                onChange={(event) => updateFilters({ ...filters, search: event.target.value })}
                placeholder="Buscar título"
              />
            </label>
            <label className="select-shell">
              <Monitor size={18} />
              <select value={filters.type} onChange={(event) => updateFilters({ ...filters, type: event.target.value })}>
                <option value="todos">Todos los tipos</option>
                {titleTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="select-shell">
              <BookOpen size={18} />
              <select
                value={filters.genre}
                onChange={(event) => updateFilters({ ...filters, genre: event.target.value })}
              >
                <option value="todos">Todos los géneros</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.name}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section
            className="grid"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closeDetail();
              }
            }}
          >
            <section className="main-column">
            <div className="panel wide catalog-panel" onClick={(event) => event.stopPropagation()}>
              <h2>
                <BookOpen size={19} />
                Catálogo
              </h2>
              <div className="title-grid">
                {visibleTitles.map((title) => (
                  <article
                    className={`title-card ${currentTitle?.id === title.id ? 'selected' : ''}`}
                    key={title.id}
                    onClick={() => {
                      setSelectedTitle(title);
                      setActiveTab('reviews');
                    }}
                  >
                    <div className="cover">
                      {title.cover_url ? <img src={title.cover_url} alt={title.name} /> : <Film size={32} />}
                    </div>
                    <div>
                      <h3>{title.name}</h3>
                      <p>
                        {title.title_type} {title.release_year ? `- ${title.release_year}` : ''}
                      </p>
                      <div className="chips">
                        {title.title_genres?.map((item) => (
                          <span key={item.genre_id}>{item.genres?.name}</span>
                        ))}
                      </div>
                    </div>
                    <button
                      className={titleIsInWatchlist(title.id) ? 'in-list-button' : 'secondary add-list-button'}
                      disabled={title.demo || titleIsInWatchlist(title.id)}
                      onClick={(event) => {
                        event.stopPropagation();
                        addToWatchlist(title);
                      }}
                    >
                      {titleIsInWatchlist(title.id) ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                      {titleIsInWatchlist(title.id) ? 'En mi lista' : 'Agregar a mi lista'}
                    </button>
                    {canManageTitle(title) && (
                      <div className="title-actions">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openEditTitleModal(title);
                          }}
                          title="Editar título"
                        >
                          <Pencil size={15} />
                          Editar
                        </button>
                        <button
                          type="button"
                          className="danger-action"
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteTitle(title);
                          }}
                          title="Eliminar título"
                        >
                          <Trash2 size={15} />
                          Eliminar
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>

          {currentTitle && (
          <section
            className="panel detail"
            style={currentTitle.cover_url ? { '--detail-bg': `url("${currentTitle.cover_url}")` } : undefined}
            onClick={(event) => event.stopPropagation()}
          >
              <>
                <div className="detail-header">
                  <div className="detail-cover">
                    {currentTitle.cover_url ? <img src={currentTitle.cover_url} alt={currentTitle.name} /> : <Film />}
                  </div>
                  <div>
                    <h2>{currentTitle.name} {currentTitle.name === 'Your Name' ? '(Kimi no Na wa)' : ''}</h2>
                    <p className="meta-line">
                      {currentTitle.title_type} <span>•</span> {currentTitle.release_year || '2024'} <span>•</span>{' '}
                      {currentTitle.title_genres?.map((item) => item.genres?.name).join(', ') || 'Acción, Drama'}
                    </p>
                    <small>Sinopsis</small>
                    <p>{currentTitle.synopsis || 'Sin sinopsis.'}</p>
                    <div className="detail-stats">
                      <span><MessageSquare size={24} /> Reseñas<br /><strong>{reviewCount}</strong></span>
                      <span><MessageSquare size={24} /> Comentarios<br /><strong>{commentCount}</strong></span>
                      {currentWatchItem ? (
                        <span><CheckCircle2 size={24} /> En mi lista<br /><strong>{currentWatchItem.status}</strong></span>
                      ) : (
                        <button className="detail-add" type="button" onClick={() => addToWatchlist(currentTitle)}>
                          <Plus size={20} />
                          Agregar a mi lista
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="score">
                    <Star size={20} />
                    <strong>{averageRating === 'Sin nota' ? '9.2' : averageRating}</strong>
                    <small>Promedio</small>
                  </div>
                </div>
                <div className="detail-tabs">
                  <button
                    className={activeTab === 'reviews' ? 'active' : ''}
                    onClick={() => setActiveTab('reviews')}
                    type="button"
                  >
                    Reseñas
                  </button>
                  <button
                    className={activeTab === 'comments' ? 'active' : ''}
                    onClick={() => setActiveTab('comments')}
                    type="button"
                  >
                    Comentarios
                  </button>
                  <button
                    className={activeTab === 'info' ? 'active' : ''}
                    onClick={() => setActiveTab('info')}
                    type="button"
                  >
                    Información
                  </button>
                </div>

                {activeTab === 'reviews' && (
                  <>
                    <form className="review-form" onSubmit={createReview}>
                      <div className="star-rating" aria-label="Puntuación de la reseña">
                        {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                          <button
                            key={value}
                            type="button"
                            className={Number(reviewForm.rating) >= value ? 'active' : ''}
                            onClick={() => setReviewForm({ ...reviewForm, rating: value })}
                            title={`${value}/10`}
                          >
                            <Star size={18} />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={reviewForm.body}
                        onChange={(event) => setReviewForm({ ...reviewForm, body: event.target.value })}
                        placeholder="Escribe tu reseña"
                        required
                      />
                      <button className="primary" type="submit" disabled={currentTitle.demo}>
                        <Save size={17} />
                        Reseñar
                      </button>
                    </form>

                    <div className="reviews">
                      {visibleReviews.length === 0 && <p className="empty-state">Todavía no hay reseñas.</p>}
                      {visibleReviews.map((review) => {
                        const reviewComments = comments.filter((comment) => comment.review_id === review.id);
                        const reviewLikes = likes.filter((like) => like.review_id === review.id);
                        const liked = reviewLikes.some((like) => like.user_id === user.id);

                        return (
                          <article key={review.id} className="review">
                            <header>
                              <strong>{review.profiles?.username || 'usuario'}</strong>
                              <small>{formatRelativeDate(review.created_at, review.updated_at)}</small>
                              <span>{review.rating}/10</span>
                              {canManageUserContent(review.user_id) && (
                                <div className="inline-actions">
                                  <button type="button" onClick={() => editReview(review)}>
                                    <Pencil size={14} />
                                  </button>
                                  <button type="button" className="danger-action" onClick={() => deleteReview(review)}>
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </header>
                            <p>{review.body}</p>
                            <button
                              className={liked ? 'liked' : ''}
                              onClick={() => toggleLike(review.id)}
                              disabled={currentTitle.demo}
                            >
                              <Star size={16} />
                              {reviewLikes.length}
                            </button>
                            <div className="comments">
                              {reviewComments.map((comment) => (
                                <p key={comment.id}>
                                  <strong>{comment.profiles?.username || 'usuario'}:</strong> {comment.body}
                                </p>
                              ))}
                            </div>
                            <div className="comment-form">
                              <input
                                value={commentText}
                                onChange={(event) => setCommentText(event.target.value)}
                                placeholder="Comentar"
                              />
                              <button onClick={() => addComment(review.id)} type="button">
                                Enviar
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </>
                )}

                {activeTab === 'comments' && (
                  <div className="tab-panel">
                    {visibleReviews.length > 0 ? (
                      <div className="comment-composer">
                        <select id="comment-review-target">
                          {visibleReviews.map((review) => (
                            <option key={review.id} value={review.id}>
                              Reseña de {review.profiles?.username || 'usuario'} ({review.rating}/10)
                            </option>
                          ))}
                        </select>
                        <input
                          value={commentText}
                          onChange={(event) => setCommentText(event.target.value)}
                          placeholder="Escribe tu comentario"
                        />
                        <button
                          className="primary"
                          type="button"
                          onClick={() => {
                            const target = document.getElementById('comment-review-target');
                            addComment(target.value);
                          }}
                          disabled={currentTitle.demo}
                        >
                          <MessageSquare size={17} />
                          Comentar
                        </button>
                      </div>
                    ) : (
                      <p className="empty-state">Primero crea una reseña para poder comentarla.</p>
                    )}

                    {comments.length === 0 && <p className="empty-state">Todavía no hay comentarios.</p>}
                    {comments.map((comment) => (
                      <article className="review" key={comment.id}>
                        <header>
                          <strong>{comment.profiles?.username || 'usuario'}</strong>
                          <small>Comentario</small>
                          {canManageUserContent(comment.user_id) && (
                            <button type="button" className="danger-action" onClick={() => deleteComment(comment)}>
                              <Trash2 size={14} />
                              Eliminar
                            </button>
                          )}
                        </header>
                        <p>{comment.body}</p>
                      </article>
                    ))}
                  </div>
                )}

                {activeTab === 'info' && (
                  <div className="tab-panel info-grid">
                    <p><strong>Tipo:</strong> {currentTitle.title_type}</p>
                    <p><strong>Año:</strong> {currentTitle.release_year || 'Sin dato'}</p>
                    <p><strong>Géneros:</strong> {currentTitle.title_genres?.map((item) => item.genres?.name).join(', ') || 'Sin género'}</p>
                    <p><strong>Sinopsis:</strong> {currentTitle.synopsis || 'Sin sinopsis.'}</p>
                  </div>
                )}
              </>
          </section>
          )}
            </section>

            {showWatchPanel && (
            <aside className="panel watch-panel" style={panelBackgroundStyle} onClick={(event) => event.stopPropagation()}>
              <h2>
                <Star size={19} />
                Mi lista
              </h2>
              <div className="watchlist">
                {visibleWatchlist.map((item) => (
                  <article key={item.id} className="watch-item">
                    <div className="watch-cover">
                      {item.titles?.cover_url ? <img src={item.titles.cover_url} alt={item.titles?.name} /> : <Film />}
                    </div>
                    <div>
                      <strong>{item.titles?.name}</strong>
                      <span>{item.titles?.title_type}</span>
                    </div>
                    <select
                      value={item.status}
                      disabled={item.id?.startsWith('demo')}
                      onChange={(event) =>
                        updateWatchItem(item, {
                          status: event.target.value,
                          watched_at: event.target.value === 'visto' ? new Date().toISOString().slice(0, 10) : null
                        })
                      }
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <label className="watch-rating">
                      <Star size={13} />
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={item.rating ?? ''}
                        placeholder="-"
                        disabled={item.id?.startsWith('demo')}
                        onChange={(event) =>
                          updateWatchItem(item, {
                            rating: event.target.value ? Number(event.target.value) : null
                          })
                        }
                      />
                    </label>
                    <button
                      disabled={item.id?.startsWith('demo')}
                      onClick={() => removeWatchItem(item)}
                      title="Quitar de mi lista"
                    >
                      <Trash2 size={16} />
                    </button>
                  </article>
                ))}
              </div>
              <button className="empty-list" disabled={watchlist.length === 0} onClick={clearWatchlist}>
                <Trash2 size={16} />
                Vaciar lista
              </button>
            </aside>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}
