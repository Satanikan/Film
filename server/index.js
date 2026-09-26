import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { JsonStore } from './store.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// PUBLIC_ORIGIN — адрес сайта в интернете, например https://film.example.
// Если он https, включаются HSTS, Secure-cookie и upgrade-insecure-requests.
const publicOrigins = (process.env.PUBLIC_ORIGIN ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const https = publicOrigins.some((o) => o.startsWith('https://'));

// TRUST_PROXY — число прокси (nginx, Cloudflare…) перед сервером. Нужно,
// чтобы лимиты запросов считались по реальному IP посетителя.
const trustProxy = process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : false;

const store = await new JsonStore(process.env.DATA_FILE ?? path.join(root, 'data', 'db.json')).load();
const app = createApp({
  store,
  distDir: path.join(root, 'dist'),
  https,
  allowedOrigins: publicOrigins,
  trustProxy,
});

const port = Number(process.env.PORT ?? 3000);
// По умолчанию слушаем только localhost; в Docker/на сервере задайте HOST=0.0.0.0.
const host = process.env.HOST ?? '127.0.0.1';

const server = app.listen(port, host, () => {
  console.log(`Сервер запущен: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
});
server.headersTimeout = 20_000;
server.requestTimeout = 30_000;

const pruneTimer = setInterval(() => app.locals.auth.pruneSessions(), 60 * 60 * 1000);
pruneTimer.unref();

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  });
}
