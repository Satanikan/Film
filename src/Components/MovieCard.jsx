import { Link } from 'react-router-dom';
import Poster from './Poster';
import { HeartIcon, PlayIcon } from './Icons';
import { useFavorites } from '../lib/favorites';

export default function MovieCard({ movie }) {
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(movie.id);
  const meta = [movie.year, movie.duration].filter(Boolean).join(' · ');

  return (
    <article className="movie-card">
      <Link to={`/watch/${encodeURIComponent(movie.id)}`} className="movie-card-link">
        <div className="movie-card-poster">
          <Poster id={movie.id} title={movie.title} year={movie.year} />
          <span className="movie-card-play" aria-hidden="true"><PlayIcon size={28} /></span>
          {movie.featured && <span className="badge badge-free">Полный фильм</span>}
        </div>
        <h3 className="movie-card-title">{movie.title}</h3>
        {meta && <p className="movie-card-meta">{meta}</p>}
      </Link>
      <button
        type="button"
        className={`fav-btn ${fav ? 'is-active' : ''}`}
        onClick={() => toggle(movie)}
        aria-pressed={fav}
        aria-label={fav ? `Убрать «${movie.title}» из избранного` : `Добавить «${movie.title}» в избранное`}
        title={fav ? 'В избранном' : 'В избранное'}
      >
        <HeartIcon size={18} filled={fav} />
      </button>
    </article>
  );
}

export function MovieGrid({ movies }) {
  return (
    <div className="movie-grid">
      {movies.map((m) => <MovieCard key={m.id} movie={m} />)}
    </div>
  );
}

export function SkeletonGrid({ count = 12 }) {
  return (
    <div className="movie-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="movie-card skeleton">
          <div className="poster skeleton-block" />
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
      ))}
    </div>
  );
}
