import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Backend/.env wins over any inherited shell/CI values.
dotenv.config({
  path: path.join(__dirname, '.env'),
  override: true,
});
