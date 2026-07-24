import '../loadEnv.js';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_BUCKET || 'uploads';
const objectPath = 'avatars/1784847550054-9umes9lcky.jpeg';

const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: listed, error: listError } = await client.storage.from(bucket).list('avatars', { limit: 20 });
console.log('list_error:', listError?.message || null);
console.log(
  'files:',
  (listed || []).map((f) => f.name),
);

const { data: pub } = client.storage.from(bucket).getPublicUrl(objectPath);
console.log('public_url:', pub?.publicUrl);

const { data: signed, error: signError } = await client.storage
  .from(bucket)
  .createSignedUrl(objectPath, 60);
console.log('signed_error:', signError?.message || null);
console.log('signed_url:', signed?.signedUrl ? 'ok' : null);

if (signed?.signedUrl) {
  const res = await fetch(signed.signedUrl, { method: 'GET' });
  console.log('signed_fetch_status:', res.status);
}
