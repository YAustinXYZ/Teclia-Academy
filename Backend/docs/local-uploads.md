# Local uploads mode

## Cómo activar modo local

Set `LOCAL_UPLOADS=true` in your environment before starting the backend.

## Cómo volver a Supabase

Set `LOCAL_UPLOADS=false` (or remove the variable) and make sure your Supabase credentials are present.

For Vercel, configure these environment variables:

- `DATABASE_URL`: the PostgreSQL connection string used by Prisma migrations and the API.
- `SUPABASE_URL`: the full project URL, for example `https://your-project.supabase.co`.
- `SUPABASE_SERVICE_KEY`: the server-only service role key. Never expose it as a `VITE_` variable.
- `SUPABASE_ANON_KEY`: the project's public anon/publishable key, used for signed browser uploads.
- `SUPABASE_BUCKET`: an existing bucket; defaults to `uploads`.
- `LOCAL_UPLOADS`: set to `false` or leave unset.

The app currently resolves uploaded content with public Storage URLs, so the configured bucket must be public. Increase the bucket's file-size limit to allow the video sizes you intend to upload; Supabase plan limits still apply.

Files larger than 4 MB are sent directly from the browser to Supabase using resumable TUS uploads, avoiding Vercel's function request-size limit. Smaller files continue to use the existing API upload.

## Estructura de carpetas

The backend stores files under:

- `Backend/uploads/<subfolder>/<filename>` for local mode

## Limitaciones

- URLs are not signed or expiring.
- There is no access control beyond the server route protections.
- This mode is intended for local development and small test environments.

## Ejemplos

### Upload

```js
const storagePath = await storage.upload(req.file, 'courses');
```

### Retrieval

```js
const url = storage.resolveUrl(storagePath);
```

### Delete

```js
await storage.delete(storagePath);
```
