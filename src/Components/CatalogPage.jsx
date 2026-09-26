import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CATEGORIES, FEATURED } from '../data/catalog';
import { api } from '../lib/api';
import { MovieGrid, SkeletonGrid } from './MovieCard';
import { SearchIcon } from './Icons';
import ExternalLink from './ExternalLink';
import { LIMITS } from '../../shared/validation.js';

const SORTS = [
  { value: 'popular', label: 'Популярные' },
  { value: 'new', label: 'Недавно добавленные' },
  { value: 'old', label: 'Сначала старые' },
];

const COLLECTION_URL = {
  films: 'https://archive.org/details/feature_films',
  animation: 'https://archive.org/details/animationandcartoons',
  serials: 'https://archive.org/details/classic_tv',
};

// Раздел каталога: сверху наша проверенная подборка, ниже — живой каталог
// Internet Archive с поиском, сортировкой и подгрузкой.
export default function CatalogPage({ category, intro }) {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const sort = params.get('sort') ?? 'popular';
  const [draft, setDraft] = useState(q);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('loading');
  const featured = FEATURED.filter((f) => f.category === category).map((f) => ({ ...f, featured: true }));

  useEffect(() => setDraft(q), [q]);

  useEffect(() => {
    const ctrl = new AbortController();
    setStatus(page === 1 ? 'loading' : 'more');
    const qs = new URLSearchParams({ category, q, sort, page: String(page) });
    api(`/catalog?${qs}`, { signal: ctrl.signal })
      .then((data) => {
        setItems((prev) => (page === 1 ? data.items : [...prev, ...data.items.filter((i) => !prev.some((p) => p.id === i.id))]));
        setHasMore(data.hasMore);
        setTotal(data.total);
        setStatus('ok');
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setStatus('error');
      });
    return () => ctrl.abort();
  }, [category, q, sort, page]);

  const update = (next) => {
    const merged = { q, sort, ...next };
    const clean = Object.fromEntries(Object.entries(merged).filter(([k, v]) => v && !(k === 'sort' && v === 'popular')));
    setPage(1);
    setParams(clean);
  };

  return (
    <div className="container page">
      <header className="page-head">
        <h1>{CATEGORIES[category].title}</h1>
        <p className="lead">{intro}</p>
      </header>

      {featured.length > 0 && !q && (
        <section className="section">
          <h2 className="section-title">Подборка редакции</h2>
          <MovieGrid movies={featured} />
        </section>
      )}

      <section className="section">
        <div className="toolbar">
          <h2 className="section-title">
            Каталог Internet Archive
            {status === 'ok' && total > 0 && <span className="count">{total.toLocaleString('ru-RU')}</span>}
          </h2>
          <form className="toolbar-controls" role="search" onSubmit={(e) => { e.preventDefault(); update({ q: draft.trim() }); }}>
            <label className="field-inline">
              <SearchIcon size={16} />
              <input
                type="search"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Название на английском"
                aria-label="Поиск в разделе"
                maxLength={LIMITS.searchMax}
              />
            </label>
            <select value={sort} onChange={(e) => update({ sort: e.target.value })} aria-label="Сортировка">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </form>
        </div>

        {status === 'loading' && <SkeletonGrid />}
        {status === 'error' && (
          <div className="notice">
            <p><strong>Каталог Internet Archive сейчас недоступен.</strong> Попробуйте обновить страницу чуть позже
              или откройте коллекцию напрямую: <ExternalLink href={COLLECTION_URL[category]}>archive.org</ExternalLink></p>
          </div>
        )}
        {(status === 'ok' || status === 'more') && items.length === 0 && (
          <p className="empty">Ничего не нашлось. Попробуйте другое название — в каталоге они на английском.</p>
        )}
        {items.length > 0 && status !== 'loading' && <MovieGrid movies={items} />}
        {hasMore && status !== 'loading' && status !== 'error' && (
          <div className="center">
            <button type="button" className="btn btn-ghost" disabled={status === 'more'} onClick={() => setPage((p) => p + 1)}>
              {status === 'more' ? 'Загружаем…' : 'Показать ещё'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
