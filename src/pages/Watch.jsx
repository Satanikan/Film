import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from '../lib/links';
import Player from '../Components/Player';
import { MovieGrid } from '../Components/MovieCard';
import ExternalLink from '../Components/ExternalLink';
import { HeartIcon } from '../Components/Icons';
import { FEATURED, FEATURED_BY_ID, archivePageUrl } from '../data/catalog';
import { useFavorites } from '../lib/favorites';
import { api } from '../lib/api';
import { ARCHIVE_ID_RE } from '../../shared/validation.js';

const Watch = () => {
  const { id } = useParams();
  const local = Object.hasOwn(FEATURED_BY_ID, id) ? FEATURED_BY_ID[id] : null;
  const [remote, setRemote] = useState(null);
  const [error, setError] = useState(null);
  const { isFavorite, toggle } = useFavorites();

  useEffect(() => {
    setRemote(null);
    setError(null);
    if (local) return undefined;
    if (!ARCHIVE_ID_RE.test(id)) {
      setError('Некорректная ссылка на фильм');
      return undefined;
    }
    const ctrl = new AbortController();
    api(`/catalog/item/${encodeURIComponent(id)}`, { signal: ctrl.signal })
      .then(setRemote)
      .catch((err) => err.name !== 'AbortError' && setError(err.message));
    return () => ctrl.abort();
  }, [id, local]);

  const movie = local ?? remote;
  const more = FEATURED.filter((f) => f.id !== id).slice(0, 5).map((f) => ({ ...f, featured: true }));

  if (error) {
    return (
      <div className="container page">
        <div className="notice notice-error">
          <h1>Не удалось открыть фильм</h1>
          <p>{error}</p>
          <Link to="/films" className="btn btn-primary">К каталогу</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page watch">
      {movie ? <Player id={id} title={movie.title} /> : <div className="player skeleton-block" />}

      <div className="watch-info">
        <div className="watch-main">
          <h1 className="watch-title">{movie?.title ?? 'Загрузка…'}</h1>
          {movie && (
            <p className="watch-meta">
              {[movie.original, movie.year, movie.duration ?? movie.runtime, movie.director ?? movie.creator].filter(Boolean).join(' · ')}
            </p>
          )}
          {movie?.genres && (
            <ul className="tags">{movie.genres.map((g) => <li key={g}>{g}</li>)}</ul>
          )}
          {movie?.description && <p className="watch-description">{movie.description}</p>}
        </div>
        <aside className="watch-side">
          {movie && (
            <button type="button" className={`btn ${isFavorite(id) ? 'btn-primary' : 'btn-ghost'}`} onClick={() => toggle({ ...movie, id })} aria-pressed={isFavorite(id)}>
              <HeartIcon size={18} filled={isFavorite(id)} /> {isFavorite(id) ? 'В избранном' : 'В избранное'}
            </button>
          )}
          <p className="muted small">
            Фильм в общественном достоянии. Видео транслируется с Internet Archive.
            Не запускается? <ExternalLink href={archivePageUrl(id)}>Открыть на archive.org</ExternalLink>{' '}
            или <Link to={`/error?page=${encodeURIComponent(`/watch/${id}`)}`}>сообщите нам</Link>.
          </p>
        </aside>
      </div>

      <section className="section">
        <h2 className="section-title">Смотрите также</h2>
        <MovieGrid movies={more} />
      </section>
    </div>
  );
};

export default Watch;
