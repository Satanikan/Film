import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { AuthService, SESSION_TTL_MS, publicUser } from './auth.js';
import { ArchiveClient, ArchiveError } from './archive.js';
import { createLimiters, parseCookies, requireSameOrigin, securityHeaders } from './security.js';
import { validateReport } from '../shared/validation.js';

export function createApp({
  store,
  fetchImpl,
  distDir = null,
  https = false,
  allowedOrigins = [],
  trustProxy = false,
  rateLimits = {},
  logger = console,
} = {}) {
  const app = express();
  const auth = new AuthService(store);
  const archive = new ArchiveClient({ fetchImpl });
  const limiters = createLimiters(rateLimits);

  // Префикс __Host- запрещает перезапись cookie с поддоменов и требует HTTPS.
  const cookieName = https ? '__Host-sid' : 'sid';
  const cookieOptions = {
    httpOnly: true, // недоступна из JavaScript — XSS не украдёт сессию
    secure: https,
    sameSite: 'strict', // не отправляется при переходах и запросах с чужих сайтов
    path: '/',
  };

  app.disable('x-powered-by');
  app.set('trust proxy', trustProxy);
  app.locals.auth = auth;

  app.use(securityHeaders({ https }));

  const api = express.Router();
  api.use(limiters.api);
  api.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  api.use(requireSameOrigin({ allowedOrigins }));
  api.use(express.json({ limit: '16kb', strict: true }));

  const currentUser = (req) => auth.getSessionUser(parseCookies(req.headers.cookie)[cookieName]);

  const startSession = (res, user) => {
    res.cookie(cookieName, auth.createSession(user), { ...cookieOptions, maxAge: SESSION_TTL_MS });
  };

  api.get('/health', (req, res) => res.json({ ok: true }));

  api.get('/auth/me', (req, res) => {
    const user = currentUser(req);
    res.json({ user: user ? publicUser(user) : null });
  });

  api.post('/auth/register', limiters.auth, async (req, res, next) => {
    try {
      const { name, login, password } = req.body ?? {};
      const result = await auth.register({ name, login, password });
      if (result.error) return res.status(result.status).json({ error: result.error });
      startSession(res, result.user);
      return res.status(201).json({ user: publicUser(result.user) });
    } catch (err) {
      return next(err);
    }
  });

  api.post('/auth/login', limiters.auth, async (req, res, next) => {
    try {
      const { login, password } = req.body ?? {};
      // Если в браузере была старая сессия — закрываем её и выдаём новую
      // (защита от фиксации сессии).
      auth.destroySession(parseCookies(req.headers.cookie)[cookieName]);
      const result = await auth.login({ login, password });
      if (result.error) return res.status(result.status).json({ error: result.error });
      startSession(res, result.user);
      return res.json({ user: publicUser(result.user) });
    } catch (err) {
      return next(err);
    }
  });

  api.post('/auth/logout', (req, res) => {
    auth.destroySession(parseCookies(req.headers.cookie)[cookieName]);
    res.clearCookie(cookieName, cookieOptions);
    res.json({ ok: true });
  });

  api.get('/catalog', async (req, res, next) => {
    try {
      const { category, q, page, sort } = req.query;
      const str = (v) => (typeof v === 'string' ? v : undefined);
      res.json(await archive.search({ category: str(category), q: str(q), page: str(page) ?? 1, sort: str(sort) }));
    } catch (err) {
      next(err);
    }
  });

  api.get('/catalog/item/:id', async (req, res, next) => {
    try {
      res.json(await archive.item(req.params.id));
    } catch (err) {
      next(err);
    }
  });

  api.post('/reports', limiters.reports, async (req, res, next) => {
    try {
      const body = req.body ?? {};
      const error = validateReport(body);
      // Боту из ловушки отвечаем «успехом», чтобы он не подбирал обход.
      if (error === 'spam') return res.status(201).json({ ok: true });
      if (error) return res.status(400).json({ error });
      const user = currentUser(req);
      store.data.reports.push({
        type: body.type,
        message: body.message.trim(),
        page: body.page || null,
        userId: user?.id ?? null,
        createdAt: new Date().toISOString(),
      });
      if (store.data.reports.length > 1000) store.data.reports.splice(0, store.data.reports.length - 1000);
      await store.save();
      return res.status(201).json({ ok: true });
    } catch (err) {
      return next(err);
    }
  });

  api.use((req, res) => res.status(404).json({ error: 'Не найдено' }));

  app.use('/api', api);

  // Собранный фронтенд (npm run build). Для SPA все неизвестные пути отдают index.html.
  if (distDir && existsSync(path.join(distDir, 'index.html'))) {
    app.use(
      '/assets',
      express.static(path.join(distDir, 'assets'), { immutable: true, maxAge: '1y', fallthrough: false }),
    );
    app.use(express.static(distDir, { index: false, maxAge: '1h', dotfiles: 'allow' }));
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      res.setHeader('Cache-Control', 'no-cache');
      return res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  // Единый обработчик ошибок: наружу — короткое сообщение без стек-трейса.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof ArchiveError) return res.status(err.status).json({ error: err.message });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Слишком большой запрос' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Некорректный JSON' });
    if (err.status === 404 || err.statusCode === 404) return res.status(404).json({ error: 'Не найдено' });
    logger.error(err);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  });

  return app;
}
