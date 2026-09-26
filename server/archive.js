import { ARCHIVE_ID_RE, LIMITS } from '../shared/validation.js';
import { FEATURED } from '../src/data/catalog.js';

// Раздел сайта -> коллекция Internet Archive. Берём только тематические
// коллекции фильмов в общественном достоянии, а не весь поток пользовательских загрузок.
export const CATEGORY_COLLECTIONS = {
  films: 'feature_films',
  animation: 'animationandcartoons',
  serials: 'classic_tv',
};

// Воспроизводим только записи из этих коллекций (и их подборок) или из нашей
// проверенной подборки. Так по прямой ссылке /watch/<id> нельзя открыть
// на сайте произвольную, в том числе пиратскую, загрузку.
const ALLOWED_COLLECTIONS = new Set([
  ...Object.values(CATEGORY_COLLECTIONS),
  'silent_films', 'sci-fi_horror', 'SciFi_Horror', 'film_noir', 'Film_Noir', 'comedy_films',
  'classic_cartoons', 'vintage_cartoons', 'feature_films_picfixer', 'classic_tv_1950s',
  'classic_tv_1960s', 'film-serials', 'moviesandfilms',
]);
const FEATURED_IDS = new Set(FEATURED.map((f) => f.id));

const SORTS = {
  popular: 'downloads desc',
  new: 'addeddate desc',
  old: 'year asc',
};

const PAGE_SIZE = 24;
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 500;

export class ArchiveError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}

// Убираем всё, кроме букв, цифр и пробелов: пользовательский текст не должен
// превращаться в операторы поискового языка Lucene (AND/OR, *, :, скобки…).
export function sanitizeQuery(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .slice(0, LIMITS.searchMax)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w && !/^(and|or|not|to)$/i.test(w))
    .slice(0, 8)
    .join(' ');
}

// Описания на archive.org бывают с HTML. Превращаем в чистый текст:
// на сайте он выводится только как текст, без dangerouslySetInnerHTML.
export function htmlToText(value) {
  const text = Array.isArray(value) ? value.join('\n') : String(value ?? '');
  return text
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(p|div|li|h\d)\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim()
    .slice(0, 3000);
}

const first = (v) => (Array.isArray(v) ? v[0] : v);
const cleanString = (v, max = 200) => (typeof first(v) === 'string' ? first(v).trim().slice(0, max) : '');

function parseYear(doc) {
  const raw = first(doc.year) ?? first(doc.date);
  const match = String(raw ?? '').match(/\b(1[89]\d\d|20\d\d)\b/);
  return match ? Number(match[1]) : null;
}

export function toCard(doc) {
  if (!doc || typeof doc.identifier !== 'string' || !ARCHIVE_ID_RE.test(doc.identifier)) return null;
  return {
    id: doc.identifier,
    title: cleanString(doc.title) || doc.identifier,
    year: parseYear(doc),
    creator: cleanString(doc.creator, 120),
  };
}

export class ArchiveClient {
  constructor({ fetchImpl = globalThis.fetch, timeoutMs = 8000 } = {}) {
    this.fetch = fetchImpl;
    this.timeoutMs = timeoutMs;
    this.cache = new Map();
  }

  async getJson(url) {
    const hit = this.cache.get(url);
    if (hit && hit.expires > Date.now()) return hit.value;

    let res;
    try {
      res = await this.fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'FilmSite/1.0 (+https://github.com/satanikan/film)' },
        redirect: 'error',
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      throw new ArchiveError('Каталог Internet Archive временно недоступен');
    }
    if (!res.ok) throw new ArchiveError('Каталог Internet Archive временно недоступен');
    const value = await res.json();

    if (this.cache.size >= CACHE_MAX) this.cache.delete(this.cache.keys().next().value);
    this.cache.set(url, { value, expires: Date.now() + CACHE_TTL_MS });
    return value;
  }

  async search({ category = 'films', q = '', page = 1, sort = 'popular' } = {}) {
    const collection = CATEGORY_COLLECTIONS[category];
    if (!collection) throw new ArchiveError('Неизвестный раздел', 400);
    const pageNum = Number.parseInt(page, 10);
    if (!Number.isInteger(pageNum) || pageNum < 1 || pageNum > 50) throw new ArchiveError('Некорректная страница', 400);
    const sortBy = Object.hasOwn(SORTS, sort) ? SORTS[sort] : SORTS.popular;

    const words = sanitizeQuery(q);
    let query = `collection:(${collection}) AND mediatype:(movies)`;
    if (words) query += ` AND title:(${words.split(' ').join(' AND ')})`;

    const params = new URLSearchParams({ q: query, rows: String(PAGE_SIZE), page: String(pageNum), output: 'json' });
    for (const field of ['identifier', 'title', 'year', 'date', 'creator']) params.append('fl[]', field);
    params.append('sort[]', sortBy);

    const data = await this.getJson(`https://archive.org/advancedsearch.php?${params}`);
    const docs = Array.isArray(data?.response?.docs) ? data.response.docs : [];
    const total = Number(data?.response?.numFound) || 0;
    return {
      items: docs.map(toCard).filter(Boolean),
      page: pageNum,
      total,
      hasMore: pageNum * PAGE_SIZE < total,
    };
  }

  async item(id) {
    if (typeof id !== 'string' || !ARCHIVE_ID_RE.test(id)) throw new ArchiveError('Некорректный идентификатор', 400);
    const data = await this.getJson(`https://archive.org/metadata/${encodeURIComponent(id)}`);
    const meta = data?.metadata;
    if (!meta || first(meta.mediatype) !== 'movies') throw new ArchiveError('Фильм не найден', 404);

    const collections = [].concat(meta.collection ?? []);
    if (!FEATURED_IDS.has(id) && !collections.some((c) => ALLOWED_COLLECTIONS.has(c))) {
      throw new ArchiveError('Этот фильм не входит в каталог общественного достояния', 404);
    }

    return {
      id,
      title: cleanString(meta.title) || id,
      year: parseYear(meta),
      creator: cleanString(meta.creator, 200),
      runtime: cleanString(meta.runtime, 40),
      description: htmlToText(meta.description),
      license: cleanString(meta.licenseurl, 200),
    };
  }
}
