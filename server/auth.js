import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { validateLogin, validateName, validatePassword } from '../shared/validation.js';

const scryptAsync = promisify(scrypt);

// Параметры scrypt: ~32 МБ памяти на одну проверку — перебор украденной базы
// становится очень дорогим, а для одного входа это десятки миллисекунд.
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, keyLen: 64 };

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_IDLE_MS = 2 * 24 * 60 * 60 * 1000;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const { N, r, p, keyLen } = SCRYPT;
  const hash = await scryptAsync(password, salt, keyLen, { N, r, p, maxmem: 64 * 1024 * 1024 });
  return ['scrypt', N, r, p, salt.toString('base64'), hash.toString('base64')].join('$');
}

export async function verifyPassword(password, stored) {
  const [algo, N, r, p, saltB64, hashB64] = String(stored).split('$');
  if (algo !== 'scrypt') return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = await scryptAsync(password, Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(N), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
  });
  // Сравнение за постоянное время — время ответа не подсказывает, сколько байт совпало.
  return timingSafeEqual(actual, expected);
}

// Хэш для несуществующих пользователей: проверку делаем всегда, чтобы по времени
// ответа нельзя было понять, зарегистрирован ли логин.
const dummyHashPromise = hashPassword(randomBytes(16).toString('hex'));

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

// Префикс в ключе: логины вроде "__proto__" или "constructor" проходят формат,
// но не должны пересекаться со свойствами Object.prototype.
const keyOf = (login) => `login:${login.toLowerCase()}`;

export function publicUser(user) {
  return { id: user.id, name: user.name, login: user.login };
}

export class AuthService {
  constructor(store, { now = () => Date.now() } = {}) {
    this.store = store;
    this.now = now;
    // В хранилище сессий лежит только SHA-256 токена: утечка памяти/дампа
    // не даёт готовых cookie для входа.
    this.sessions = new Map();
  }

  get users() {
    return this.store.data.users;
  }

  findUser(login) {
    const key = keyOf(login);
    return Object.hasOwn(this.users, key) ? this.users[key] : null;
  }

  async register({ name, login, password }) {
    const error = validateName(name) || validateLogin(login) || validatePassword(password, login);
    if (error) return { error, status: 400 };
    if (this.findUser(login)) return { error: 'Этот логин уже занят', status: 409 };

    const user = {
      id: randomUUID(),
      name: name.trim(),
      login,
      passwordHash: await hashPassword(password),
      createdAt: new Date(this.now()).toISOString(),
      failedAttempts: 0,
      lockedUntil: 0,
    };
    // Повторная проверка после await: два параллельных запроса с одним логином.
    if (this.findUser(login)) return { error: 'Этот логин уже занят', status: 409 };
    this.users[keyOf(login)] = user;
    await this.store.save();
    return { user };
  }

  async login({ login, password }) {
    const generic = { error: 'Неверный логин или пароль', status: 401 };
    if (typeof login !== 'string' || typeof password !== 'string' || password.length > 1024) {
      return generic;
    }
    const user = this.findUser(login);

    if (user && user.lockedUntil > this.now()) {
      return {
        error: 'Слишком много неудачных попыток. Вход временно заблокирован, попробуйте через 15 минут',
        status: 429,
      };
    }

    const ok = await verifyPassword(password, user ? user.passwordHash : await dummyHashPromise);
    if (!user) return generic;

    if (!ok) {
      user.failedAttempts = (user.failedAttempts || 0) + 1;
      if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        user.failedAttempts = 0;
        user.lockedUntil = this.now() + LOCK_MS;
      }
      await this.store.save();
      return generic;
    }

    user.failedAttempts = 0;
    user.lockedUntil = 0;
    user.lastLoginAt = new Date(this.now()).toISOString();
    await this.store.save();
    return { user };
  }

  createSession(user) {
    const token = randomBytes(32).toString('base64url');
    const now = this.now();
    this.sessions.set(sha256(token), { userId: user.id, login: user.login, createdAt: now, lastSeenAt: now });
    return token;
  }

  getSessionUser(token) {
    if (typeof token !== 'string' || token.length > 100) return null;
    const key = sha256(token);
    const session = this.sessions.get(key);
    if (!session) return null;
    const now = this.now();
    if (now - session.createdAt > SESSION_TTL_MS || now - session.lastSeenAt > SESSION_IDLE_MS) {
      this.sessions.delete(key);
      return null;
    }
    const user = this.findUser(session.login);
    if (!user || user.id !== session.userId) {
      this.sessions.delete(key);
      return null;
    }
    session.lastSeenAt = now;
    return user;
  }

  destroySession(token) {
    if (typeof token === 'string') this.sessions.delete(sha256(token));
  }

  pruneSessions() {
    const now = this.now();
    for (const [key, s] of this.sessions) {
      if (now - s.createdAt > SESSION_TTL_MS || now - s.lastSeenAt > SESSION_IDLE_MS) this.sessions.delete(key);
    }
  }
}
