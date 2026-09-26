import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MovieGrid, SkeletonGrid } from '../Components/MovieCard';
import { FEATURED } from '../data/catalog';
import { api } from '../lib/api';

const norm = (s) => s.toLowerCase().replace(/ё/g, 'е');

const Search = () => {
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const [remote, setRemote] = useState([]);
  const [status, setStatus] = useState('idle');

  const local = q
    ? FEATURED.filter((f) => [f.title, f.original, String(f.year), f.director, ...f.genres].some((v) => norm(v).includes(norm(q))))
        .map((f) => ({ ...f, featured: true }))
    : [];

  useEffect(() => {
    if (!q) return undefined;
    const ctrl = new AbortController();
    setStatus('loading');
    api(`/catalog?${new URLSearchParams({ category: 'films', q })}`, { signal: ctrl.signal })
      .then((data) => {
        setRemote(data.items);
        setStatus('ok');
      })
      .catch((err) => err.name !== 'AbortError' && setStatus('error'));
    return () => ctrl.abort();
  }, [q]);

  const remoteOnly = remote.filter((r) => !local.some((l) => l.id === r.id));

  return (
    <div className="container page">
      <header className="page-head">
        <h1>Поиск{q && <>: «{q}»</>}</h1>
        {!q && <p className="lead">Введите название фильма в строке поиска вверху.</p>}
      </header>
      {local.length > 0 && (
        <section className="section">
          <h2 className="section-title">В подборке<span className="count">{local.length}</span></h2>
          <MovieGrid movies={local} />
        </section>
      )}
      {q && (
        <section className="section">
          <h2 className="section-title">В каталоге Internet Archive</h2>
          {status === 'loading' && <SkeletonGrid count={6} />}
          {status === 'error' && <p className="empty">Каталог сейчас недоступен, попробуйте позже.</p>}
          {status === 'ok' && remoteOnly.length === 0 && (
            <p className="empty">Ничего не нашлось. В каталоге названия на английском: попробуйте, например, «zombie» или «Chaplin».</p>
          )}
          {status === 'ok' && remoteOnly.length > 0 && <MovieGrid movies={remoteOnly} />}
        </section>
      )}
    </div>
  );
};

export default Search;
