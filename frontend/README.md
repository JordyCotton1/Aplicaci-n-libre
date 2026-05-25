# Frontend React

Interfaz de WatchList Personal hecha con React, Vite y Supabase.

## Ejecutar

1. Instalar dependencias:

```bash
npm install
```

2. Crear `.env` copiando `.env.example`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=tu_publishable_key_publica
```

3. Iniciar el servidor:

```bash
npm run dev
```

4. Abrir la URL que muestre Vite, normalmente:

```txt
http://localhost:5173
```

## Pantallas incluidas

- Login y registro.
- Perfil editable.
- Catalogo de series, peliculas y anime.
- Filtro por tipo y genero.
- Formulario para crear titulo y subir portada a Storage.
- Lista personal con estado y puntuacion.
- Detalle con resenas, comentarios, likes y promedio.
- Suscripciones Realtime para lista personal, resenas, comentarios y likes.
