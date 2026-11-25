import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env');
const text = fs.readFileSync(envPath, 'utf8');
const match = text.match(/^DATABASE_URL=(.*)$/m);

if (!match) {
  console.log('NO_DATABASE_URL');
  process.exit(1);
}

const raw = match[1].trim().replace(/^["']|["']$/g, '');
console.log('length:', raw.length);
console.log('has_placeholder:', /YOUR-PASSWORD|YOUR-PROJECT-REF|\[YOUR/.test(raw));
console.log('starts_ok:', /^postgres(ql)?:\/\//.test(raw));

try {
  const u = new URL(raw);
  console.log('hostname:', u.hostname || '(empty)');
  console.log('port:', u.port || '(default)');
  console.log('db:', u.pathname || '(empty)');
  console.log('user_set:', Boolean(u.username));
  console.log('pass_len:', u.password.length);
  const decodedPass = decodeURIComponent(u.password);
  const specials = [...new Set(decodedPass.replace(/[A-Za-z0-9._~-]/g, ''))];
  console.log('pass_special_chars:', specials.length ? specials.join(' ') : '(none)');
  console.log('status: PARSE_OK');
} catch (error) {
  console.log('status: PARSE_FAIL');
  console.log('reason:', error.message);
  const proto = raw.indexOf('://');
  const at = raw.lastIndexOf('@');
  if (proto >= 0 && at > proto) {
    const creds = raw.slice(proto + 3, at);
    const colon = creds.indexOf(':');
    if (colon >= 0) {
      const pass = creds.slice(colon + 1);
      const specials = [...new Set(pass.replace(/[A-Za-z0-9._~-]/g, ''))];
      console.log('raw_pass_len:', pass.length);
      console.log('unescaped_specials_in_pass:', specials.length ? specials.join(' ') : '(none)');
      console.log('hint: encode password with encodeURIComponent before putting it in DATABASE_URL');
    }
  }
}
