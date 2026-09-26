// Общие правила проверки данных: одни и те же для формы в браузере и для сервера.
// Клиентская проверка — только для удобства, доверяем мы исключительно серверной.

export const LOGIN_RE = /^[a-zA-Z0-9_.-]{3,32}$/;

// Идентификатор записи Internet Archive. Строгий формат не даёт подставить
// в плеер произвольный адрес (например, фишинговую страницу во фрейме).
export const ARCHIVE_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;

export const LIMITS = {
  nameMax: 50,
  passwordMin: 10,
  passwordMax: 128,
  reportMin: 10,
  reportMax: 2000,
  searchMax: 80,
};

export const REPORT_TYPES = {
  video: 'Не воспроизводится видео',
  content: 'Ошибка в описании фильма',
  site: 'Ошибка на сайте',
  phishing: 'Подозрительная ссылка или фишинг',
  other: 'Другое',
};

// Самые популярные пароли из утечек — их подбирают первыми.
const COMMON_PASSWORDS = new Set([
  '1234567890', '12345678910', '123456789012', '0987654321', '1111111111',
  '123123123123', 'qwertyuiop', 'qwerty1234', 'qwerty12345', 'qwerty123456',
  '1q2w3e4r5t', '1q2w3e4r5t6y', 'zaq12wsxcde', 'password12', 'password123',
  'password1234', 'iloveyou12', 'iloveyou123', 'admin12345', 'administrator',
  'йцукенгшщз', 'пароль1234', 'qwertyuiop123', 'asdfghjkl1', 'walkingdead',
  'thewalkingdead', 'zombie12345',
]);

const CONTROL_CHARS_RE = /[\u0000-\u001f\u007f-\u009f]/;

export function validateName(name) {
  if (typeof name !== 'string' || !name.trim()) return 'Введите имя';
  if (name.trim().length > LIMITS.nameMax) return `Имя не длиннее ${LIMITS.nameMax} символов`;
  if (CONTROL_CHARS_RE.test(name)) return 'Имя содержит недопустимые символы';
  return null;
}

export function validateLogin(login) {
  if (typeof login !== 'string' || !login) return 'Введите логин';
  if (!LOGIN_RE.test(login)) return 'Логин: 3–32 символа, латиница, цифры, точка, дефис или _';
  return null;
}

export function validatePassword(password, login = '') {
  if (typeof password !== 'string' || !password) return 'Введите пароль';
  if (password.length < LIMITS.passwordMin) return `Пароль должен быть не короче ${LIMITS.passwordMin} символов`;
  if (password.length > LIMITS.passwordMax) return `Пароль не длиннее ${LIMITS.passwordMax} символов`;
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) return 'Этот пароль слишком распространён — его подберут за секунды';
  if (/^(.)\1+$/.test(password)) return 'Пароль не должен состоять из одного символа';
  if (/^\d+$/.test(password)) return 'Пароль не должен состоять только из цифр';
  if (login && login.length >= 3 && lower.includes(login.toLowerCase())) return 'Пароль не должен содержать логин';
  return null;
}

// Грубая оценка стойкости 0..4 — только для индикатора в форме.
export function passwordStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= LIMITS.passwordMin) score++;
  if (password.length >= 14) score++;
  if (/[a-zа-яё]/.test(password) && /[A-ZА-ЯЁ]/.test(password)) score++;
  if (/\d/.test(password) && /[^\p{L}\p{N}]/u.test(password)) score++;
  if (COMMON_PASSWORDS.has(password.toLowerCase())) score = 0;
  return Math.min(score, 4);
}

export function validateReport({ type, message, page, website } = {}) {
  // website — скрытое поле-ловушка: люди его не видят, а боты заполняют.
  if (website) return 'spam';
  if (!Object.hasOwn(REPORT_TYPES, type)) return 'Выберите тип проблемы';
  if (typeof message !== 'string' || message.trim().length < LIMITS.reportMin) {
    return `Опишите проблему подробнее (от ${LIMITS.reportMin} символов)`;
  }
  if (message.length > LIMITS.reportMax) return `Сообщение не длиннее ${LIMITS.reportMax} символов`;
  if (page !== undefined && page !== '' && (typeof page !== 'string' || !/^\/[\w\-./?=&%]{0,200}$/.test(page))) {
    return 'Некорректный адрес страницы';
  }
  return null;
}
