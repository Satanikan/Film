import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

// Content-Security-Policy: браузер выполнит скрипты только с нашего домена
// и встроит во фрейм только плеер archive.org. Даже если злоумышленник
// найдёт способ внедрить HTML, чужой скрипт или фишинговая форма не заработают.
export function securityHeaders({ https = false } = {}) {
  const helmetMiddleware = helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        fontSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https://archive.org', 'https://*.archive.org', 'https://avatars.mds.yandex.net', 'https://deadtv.ru'],
        mediaSrc: ["'self'", 'https://archive.org', 'https://*.archive.org'],
        frameSrc: ['https://archive.org'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        // Формы отправляются только на наш сервер — внедрённая форма не
        // сможет отправить пароль на чужой домен.
        formAction: ["'self'"],
        // Запрет показывать сайт во фрейме на чужих страницах (clickjacking).
        frameAncestors: ["'none'"],
        manifestSrc: ["'self'"],
        workerSrc: ["'self'"],
        ...(https ? { upgradeInsecureRequests: [] } : {}),
      },
    },
    // HSTS имеет смысл только по HTTPS: браузер запомнит, что сайт нельзя
    // открывать по HTTP, и подмена через «открытый Wi‑Fi» не пройдёт.
    strictTransportSecurity: https ? { maxAge: 63072000, includeSubDomains: true, preload: true } : false,
    xFrameOptions: { action: 'deny' },
    referrerPolicy: { policy: 'no-referrer' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
  });

  return [
    helmetMiddleware,
    (req, res, next) => {
      res.setHeader(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), ' +
          'fullscreen=(self "https://archive.org"), autoplay=(self "https://archive.org")',
      );
      next();
    },
  ];
}

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Защита от CSRF: запросы, меняющие данные, принимаем только со своего сайта.
// Работает вместе с cookie SameSite=Strict и обязательным JSON (форма с чужого
// сайта не может отправить application/json без CORS-проверки).
export function requireSameOrigin({ allowedOrigins = [] } = {}) {
  const configured = new Set(allowedOrigins);
  return (req, res, next) => {
    if (!UNSAFE_METHODS.has(req.method)) return next();

    const fetchSite = req.get('sec-fetch-site');
    if (fetchSite && fetchSite !== 'same-origin') {
      return res.status(403).json({ error: 'Запрос с чужого сайта отклонён' });
    }

    const origin = req.get('origin');
    const selfOrigin = `${req.protocol}://${req.get('host')}`;
    if (!origin || !(configured.size ? configured.has(origin) : origin === selfOrigin)) {
      return res.status(403).json({ error: 'Запрос с чужого сайта отклонён' });
    }

    if (!req.is('application/json')) {
      return res.status(415).json({ error: 'Ожидается JSON' });
    }
    return next();
  };
}

const limiter = (windowMs, limit, error) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error },
  });

// Ограничение частоты запросов: защита от перебора паролей и флуда.
export function createLimiters(overrides = {}) {
  const cfg = { api: 600, auth: 20, reports: 5, ...overrides };
  return {
    api: limiter(15 * 60 * 1000, cfg.api, 'Слишком много запросов, попробуйте позже'),
    auth: limiter(15 * 60 * 1000, cfg.auth, 'Слишком много попыток входа. Подождите 15 минут'),
    reports: limiter(60 * 60 * 1000, cfg.reports, 'Слишком много сообщений, попробуйте через час'),
  };
}

export function parseCookies(header = '') {
  const out = Object.create(null);
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 1) continue;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    try {
      out[name] = decodeURIComponent(value);
    } catch {
      out[name] = value;
    }
  }
  return out;
}
