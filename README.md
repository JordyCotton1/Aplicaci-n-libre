# WatchList Personal

Aplicacion web para llevar control de series, peliculas y animes. Cada usuario puede registrar que quiere ver, que esta viendo, que ya vio, que abandono y que puntuacion le da. Tambien puede filtrar por genero y por tipo de titulo: serie, pelicula o anime.

## Tema elegido

El proyecto sera una lista personal de seguimiento para contenido audiovisual. La idea principal es que el usuario tenga una biblioteca organizada por generos y pueda guardar su estado personal de cada titulo.

Ejemplos de uso:

- Agregar una pelicula al catalogo.
- Clasificar un anime como fantasia, accion o romance.
- Marcar una serie como `viendo`.
- Marcar una pelicula como `visto` y darle una puntuacion del 1 al 10.
- Escribir una resena.
- Comentar resenas de otros usuarios.
- Dar me gusta a resenas.

## Modelo de datos

El archivo principal de base de datos es [schema.sql](schema.sql).

Tablas principales:

- `profiles`: perfil de cada usuario registrado. Esta enlazada con `auth.users`.
- `genres`: generos como accion, comedia, drama, terror o ciencia ficcion.
- `titles`: catalogo de series, peliculas y animes.
- `title_genres`: relacion entre titulos y generos, porque un titulo puede tener varios generos.
- `user_watchlist`: lista personal de cada usuario, con estado, puntuacion, progreso y notas.
- `reviews`: resenas publicas de los usuarios sobre un titulo.
- `comments`: comentarios en resenas.
- `review_likes`: me gusta en resenas.

Relaciones importantes:

- Un usuario tiene un perfil en `profiles`.
- Un titulo puede tener varios generos por medio de `title_genres`.
- Cada usuario puede tener un mismo titulo una sola vez en `user_watchlist`.
- Cada usuario puede escribir una resena por titulo.
- Una resena puede tener muchos comentarios y muchos me gusta.

## Requisitos de Supabase

Autenticacion:

- Registro con correo y contrasena.
- Inicio de sesion.
- Cierre de sesion.
- Sesion persistente al recargar.
- Las secciones privadas se muestran solo con sesion iniciada.

Perfiles:

- La tabla `profiles` se crea en el esquema `public`.
- El trigger `on_auth_user_created` crea automaticamente un perfil cuando se registra un usuario.
- Cada usuario puede editar solo su propio perfil.

RLS:

- Todas las tablas del proyecto tienen Row Level Security habilitado.
- Los titulos, generos, resenas, comentarios y likes se pueden leer publicamente.
- La lista personal `user_watchlist` solo la puede leer y modificar su propio usuario.
- Un usuario solo puede editar o borrar sus propias resenas y comentarios.

Realtime:

- `comments`: sirve para mostrar comentarios nuevos en una resena sin recargar la pagina.
- `user_watchlist`: sirve para actualizar la lista personal cuando cambia el estado, la puntuacion o el progreso.
- `review_likes`: sirve para actualizar el contador de me gusta de una resena.

Storage:

- El bucket `covers` se usa para subir portadas de series, peliculas o animes.
- La URL de la portada se guarda en `titles.cover_url`.

## Pantallas sugeridas

- Login y registro.
- Perfil del usuario.
- Catalogo de titulos con filtros por genero y tipo.
- Detalle de titulo con resenas, comentarios y puntuacion promedio.
- Mi lista, con filtros por pendiente, viendo, visto y abandonado.
- Formulario para crear titulo y subir portada.

## Comentarios obligatorios en el frontend

Cada llamada a Supabase debe tener arriba un comentario propio. Ejemplo:

```js
// Busco mi lista personal para mostrar que titulos tengo pendientes,
// cuales estoy viendo y que puntuacion le di a los que ya termine.
const { data, error } = await supabase
  .from('user_watchlist')
  .select('*, titles(*, title_genres(genres(*)))')
  .eq('user_id', user.id);
```

Otro ejemplo para Realtime:

```js
// Escucho comentarios nuevos de esta resena para agregarlos en pantalla
// sin pedirle al usuario que recargue la pagina.
const channel = supabase
  .channel('comments-by-review')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'comments',
      filter: `review_id=eq.${reviewId}`
    },
    (payload) => {
      setComments((current) => [payload.new, ...current]);
    }
  )
  .subscribe();
```

## Indice para la entrega

- SQL completo: `schema.sql`.
- Backend Supabase: `backend/README.md`.
- Frontend React: `frontend/`.
- Autenticacion: componentes o paginas de login, registro y logout.
- Perfil: pagina de perfil conectada a `profiles`.
- Cinco tablas con RLS: revisar `profiles`, `genres`, `titles`, `title_genres`, `user_watchlist`, `reviews`, `comments` y `review_likes`.
- Realtime 1: comentarios nuevos en `comments`.
- Realtime 2: cambios de estado o puntuacion en `user_watchlist`.
- Bucket: subida de portadas en `covers`.
- Capturas: login, catalogo, mi lista, detalle de titulo, perfil y comentarios en vivo.

## Como correr el proyecto

1. Ejecuta `schema.sql` en el SQL Editor de Supabase.
2. Entra a la carpeta `frontend`.
3. Ejecuta `npm install`.
4. Copia `.env.example` como `.env` y pega tu `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Ejecuta `npm run dev`.
