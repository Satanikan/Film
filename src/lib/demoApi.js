import { ApiError } from './apiError';
import { validateLogin, validateName, validatePassword, validateReport } from '../../shared/validation.js';

// Демо-версия без сервера (npm run build:demo): имитирует API прямо в браузере.
// Аккаунты хранятся только в этом браузере, пароль — в виде SHA-256.
// На настоящем сайте всё это делает Express-сервер из папки server/.

const USERS = 'film-demo:users';
const SESSION = 'film-demo:session';

function storage(name) {
  try {
    return window[name];
  } catch {
    return null;
  }
}

function read(name, key, fallback) {
  try {
    return JSON.parse(storage(name)?.getItem(key) ?? 'null') ?? fallback;
  } catch {
    return fallback;
  }
}

function write(name, key, value) {
  try {
    if (value === null) storage(name)?.removeItem(key);
    else storage(name)?.setItem(key, JSON.stringify(value));
  } catch {
    // хранилище недоступно — демо просто не запомнит вход
  }
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const keyOf = (login) => `login:${String(login).toLowerCase()}`;
const publicUser = (u) => ({ id: u.login, name: u.name, login: u.login });

export async function demoApi(path, { method = 'GET', body = {} } = {}) {
  await new Promise((resolve) => setTimeout(resolve, 250));
  const users = read('localStorage', USERS, {});
  const find = (login) => (typeof login === 'string' && Object.hasOwn(users, keyOf(login)) ? users[keyOf(login)] : null);

  if (path === '/auth/me') {
    const user = find(read('sessionStorage', SESSION, null));
    return { user: user ? publicUser(user) : null };
  }

  if (path === '/auth/register' && method === 'POST') {
    const { name, login, password } = body;
    const error = validateName(name) || validateLogin(login) || validatePassword(password, login);
    if (error) throw new ApiError(error, 400);
    if (find(login)) throw new ApiError('Этот логин уже занят', 409);
    const user = { name: name.trim(), login, hash: await sha256(password) };
    write('localStorage', USERS, { ...users, [keyOf(login)]: user });
    write('sessionStorage', SESSION, login);
    return { user: publicUser(user) };
  }

  if (path === '/auth/login' && method === 'POST') {
    const user = find(body.login);
    if (!user || user.hash !== (await sha256(String(body.password ?? '')))) {
      throw new ApiError('Неверный логин или пароль', 401);
    }
    write('sessionStorage', SESSION, user.login);
    return { user: publicUser(user) };
  }

  if (path === '/auth/logout') {
    write('sessionStorage', SESSION, null);
    return { ok: true };
  }

  if (path.startsWith('/catalog')) {
    throw new ApiError('В демо-версии живой каталог Internet Archive отключён: он работает через сервер сайта. Подборка редакции выше доступна полностью.', 503);
  }

  if (path === '/reports' && method === 'POST') {
    const error = validateReport(body);
    if (error && error !== 'spam') throw new ApiError(error, 400);
    return { ok: true };
  }

  throw new ApiError('Не найдено', 404);
}
