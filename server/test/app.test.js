import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../app.js';
import { JsonStore } from '../store.js';
import { htmlToText, sanitizeQuery } from '../archive.js';

const silent = { error() {} };

function fakeArchive(routes) {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    for (const [prefix, body] of Object.entries(routes)) {
      if (url.startsWith(prefix)) return new Response(JSON.stringify(body), { status: 200 });
    }
    return new Response('{}', { status: 404 });
  };
  return { fetchImpl, calls };
}

async function start(options = {}) {
  const app = createApp({ store: new JsonStore(), logger: silent, rateLimits: { auth: 1000 }, ...options });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (path, { method = 'GET', body, cookie, headers = {} } = {}) =>
    fetch(base + path, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json', Origin: base } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  return { server, base, request };
}

const sessionCookie = (res) => res.headers.get('set-cookie')?.split(';')[0];

describe('заголовки безопасности', () => {
  let ctx;
  before(async () => { ctx = await start({ https: true }); });
  after(() => ctx.server.close());

  test('CSP, запрет фреймов, HSTS и прочие', async () => {
    const res = await ctx.request('/api/health');
    const csp = res.headers.get('content-security-policy');
    assert.match(csp, /default-src 'self'/);
    assert.match(csp, /script-src 'self'(;|$)/);
    assert.match(csp, /frame-ancestors 'none'/);
    assert.match(csp, /form-action 'self'/);
    assert.match(csp, /frame-src https:\/\/archive\.org/);
    assert.equal(res.headers.get('x-frame-options'), 'DENY');
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('referrer-policy'), 'no-referrer');
    assert.match(res.headers.get('strict-transport-security'), /max-age=63072000/);
    assert.match(res.headers.get('permissions-policy'), /camera=\(\)/);
    assert.equal(res.headers.get('x-powered-by'), null);
    assert.equal(res.headers.get('cache-control'), 'no-store');
  });
});

describe('авторизация', () => {
  let ctx;
  before(async () => { ctx = await start(); });
  after(() => ctx.server.close());

  const good = { name: 'Рик', login: 'rick.grimes', password: 'Alexandria-2010' };

  test('регистрация, сессия, выход', async () => {
    const reg = await ctx.request('/api/auth/register', { method: 'POST', body: good });
    assert.equal(reg.status, 201);
    const setCookie = reg.headers.get('set-cookie');
    assert.match(setCookie, /HttpOnly/);
    assert.match(setCookie, /SameSite=Strict/);
    const body = await reg.json();
    assert.deepEqual(Object.keys(body.user).sort(), ['id', 'login', 'name']);

    const cookie = sessionCookie(reg);
    const me = await (await ctx.request('/api/auth/me', { cookie })).json();
    assert.equal(me.user.login, 'rick.grimes');

    const out = await ctx.request('/api/auth/logout', { method: 'POST', body: {}, cookie });
    assert.equal(out.status, 200);
    const meAfter = await (await ctx.request('/api/auth/me', { cookie })).json();
    assert.equal(meAfter.user, null, 'после выхода старая cookie не действует');
  });

  test('хэш пароля не хранится в открытом виде', async () => {
    const stored = Object.values(ctx.server.listeners('request')[0].locals.auth.users)[0];
    assert.match(stored.passwordHash, /^scrypt\$/);
    assert.ok(!stored.passwordHash.includes(good.password));
  });

  test('слабый пароль и занятый логин', async () => {
    const weak = await ctx.request('/api/auth/register', {
      method: 'POST', body: { ...good, login: 'glenn', password: '1234567890' },
    });
    assert.equal(weak.status, 400);
    const dup = await ctx.request('/api/auth/register', { method: 'POST', body: { ...good, login: 'Rick.Grimes' } });
    assert.equal(dup.status, 409);
  });

  test('логины вроде __proto__ не ломают хранилище', async () => {
    const res = await ctx.request('/api/auth/register', {
      method: 'POST', body: { name: 'x', login: '__proto__', password: 'Alexandria-2010x' },
    });
    assert.equal(res.status, 201);
    const again = await ctx.request('/api/auth/register', {
      method: 'POST', body: { name: 'x', login: 'constructor', password: 'Alexandria-2010x' },
    });
    assert.equal(again.status, 201);
    assert.equal(Object.getPrototypeOf({}).name, undefined);
  });

  test('одинаковый ответ для неверного пароля и несуществующего логина', async () => {
    const wrong = await ctx.request('/api/auth/login', { method: 'POST', body: { login: good.login, password: 'nope-nope-nope' } });
    const missing = await ctx.request('/api/auth/login', { method: 'POST', body: { login: 'negan', password: 'nope-nope-nope' } });
    assert.equal(wrong.status, 401);
    assert.equal(missing.status, 401);
    assert.deepEqual(await wrong.json(), await missing.json());
  });

  test('блокировка после 5 неудачных попыток', async () => {
    await ctx.request('/api/auth/register', { method: 'POST', body: { ...good, login: 'daryl' } });
    for (let i = 0; i < 5; i++) {
      await ctx.request('/api/auth/login', { method: 'POST', body: { login: 'daryl', password: `bad-password-${i}` } });
    }
    const locked = await ctx.request('/api/auth/login', { method: 'POST', body: { login: 'daryl', password: good.password } });
    assert.equal(locked.status, 429, 'даже верный пароль не пускает во время блокировки');
  });

  test('вход выдаёт новую сессию', async () => {
    const res = await ctx.request('/api/auth/login', { method: 'POST', body: { login: good.login, password: good.password } });
    assert.equal(res.status, 200);
    assert.ok(sessionCookie(res));
  });
});

describe('защита от CSRF и мусорных запросов', () => {
  let ctx;
  before(async () => { ctx = await start(); });
  after(() => ctx.server.close());

  const post = (headers, body = '{}') =>
    fetch(`${ctx.base}/api/auth/logout`, { method: 'POST', headers, body });

  test('без Origin — 403', async () => {
    assert.equal((await post({ 'Content-Type': 'application/json' })).status, 403);
  });

  test('с чужого сайта — 403', async () => {
    assert.equal((await post({ 'Content-Type': 'application/json', Origin: 'https://evil.example' })).status, 403);
    assert.equal(
      (await post({ 'Content-Type': 'application/json', Origin: ctx.base, 'Sec-Fetch-Site': 'cross-site' })).status,
      403,
    );
  });

  test('HTML-форма (не JSON) — 415', async () => {
    const res = await post({ 'Content-Type': 'application/x-www-form-urlencoded', Origin: ctx.base }, 'a=1');
    assert.equal(res.status, 415);
  });

  test('слишком большой запрос — 413', async () => {
    const res = await post({ 'Content-Type': 'application/json', Origin: ctx.base }, JSON.stringify({ x: 'a'.repeat(20000) }));
    assert.equal(res.status, 413);
  });

  test('лимит частоты на вход', async () => {
    const limited = await start({ rateLimits: { auth: 2 } });
    const codes = [];
    for (let i = 0; i < 3; i++) {
      const r = await limited.request('/api/auth/login', { method: 'POST', body: { login: 'x', password: 'y' } });
      codes.push(r.status);
    }
    limited.server.close();
    assert.deepEqual(codes, [401, 401, 429]);
  });
});

describe('каталог Internet Archive', () => {
  let ctx;
  let archive;
  before(async () => {
    archive = fakeArchive({
      'https://archive.org/advancedsearch.php': {
        response: {
          numFound: 30,
          docs: [
            { identifier: 'Good_Film-1', title: 'Хороший фильм', year: '1950' },
            { identifier: '../../etc/passwd', title: 'Плохой' },
            { identifier: 'Other', title: ['Массив'], date: '1931-01-01T00:00:00Z' },
          ],
        },
      },
      'https://archive.org/metadata/PdFilm': {
        metadata: {
          mediatype: 'movies',
          collection: ['feature_films'],
          title: 'PD Film',
          description: '<p>Строка&nbsp;1<br>Строка 2</p><script>alert(1)</script>',
        },
      },
      'https://archive.org/metadata/RandomUpload': {
        metadata: { mediatype: 'movies', collection: ['opensource_movies'], title: 'Чья-то загрузка' },
      },
    });
    ctx = await start({ fetchImpl: archive.fetchImpl });
  });
  after(() => ctx.server.close());

  test('поиск отдаёт только валидные идентификаторы', async () => {
    const res = await ctx.request('/api/catalog?category=films&q=ночь&page=1');
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.deepEqual(data.items.map((i) => i.id), ['Good_Film-1', 'Other']);
    assert.equal(data.items[1].title, 'Массив');
    assert.equal(data.items[1].year, 1931);
    assert.equal(data.hasMore, true);
  });

  test('пользовательский запрос не превращается в операторы Lucene', async () => {
    await ctx.request(`/api/catalog?category=films&q=${encodeURIComponent('x) OR collection:(*')}`);
    const url = new URL(archive.calls.at(-1));
    assert.equal(url.searchParams.get('q'), 'collection:(feature_films) AND mediatype:(movies) AND title:(x AND collection)');
  });

  test('неизвестный раздел и страница — 400', async () => {
    assert.equal((await ctx.request('/api/catalog?category=porn')).status, 400);
    assert.equal((await ctx.request('/api/catalog?category=films&page=999')).status, 400);
  });

  test('карточка фильма: HTML вырезан', async () => {
    const data = await (await ctx.request('/api/catalog/item/PdFilm')).json();
    assert.equal(data.description, 'Строка 1\nСтрока 2\nalert(1)');
  });

  test('фильм вне коллекций общественного достояния не открывается', async () => {
    assert.equal((await ctx.request('/api/catalog/item/RandomUpload')).status, 404);
    assert.equal((await ctx.request('/api/catalog/item/bad%2F..%2Fid')).status, 400);
  });
});

describe('сообщения об ошибках', () => {
  let ctx;
  before(async () => { ctx = await start(); });
  after(() => ctx.server.close());

  test('валидация и ловушка для ботов', async () => {
    const ok = await ctx.request('/api/reports', { method: 'POST', body: { type: 'video', message: 'Фильм не запускается', page: '/watch/abc' } });
    assert.equal(ok.status, 201);
    const bad = await ctx.request('/api/reports', { method: 'POST', body: { type: 'video', message: 'кратко' } });
    assert.equal(bad.status, 400);
    const bot = await ctx.request('/api/reports', { method: 'POST', body: { type: 'video', message: 'spam spam spam', website: 'http://spam' } });
    assert.equal(bot.status, 201);
  });
});

describe('утилиты', () => {
  test('sanitizeQuery', () => {
    assert.equal(sanitizeQuery('Ночь живых  мертвецов!'), 'Ночь живых мертвецов');
    assert.equal(sanitizeQuery('a AND b OR c'), 'a b c');
    assert.equal(sanitizeQuery({}), '');
  });
  test('htmlToText', () => {
    assert.equal(htmlToText('<b>Жирный</b> &amp; <i>курсив</i>'), 'Жирный & курсив');
  });
});
