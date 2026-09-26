import { Link } from 'react-router-dom';
import { MovieGrid } from '../Components/MovieCard';
import { FEATURED_BY_ID } from '../data/catalog';
import { useFavorites } from '../lib/favorites';

const Favorites = () => {
  const { favorites } = useFavorites();
  const movies = favorites.map((f) => (Object.hasOwn(FEATURED_BY_ID, f.id) ? { ...FEATURED_BY_ID[f.id], featured: true } : f));

  return (
    <div className="container page">
      <header className="page-head">
        <h1>Избранное</h1>
        <p className="lead">Фильмы, отмеченные сердечком. Список хранится в этом браузере.</p>
      </header>
      {movies.length ? (
        <MovieGrid movies={movies} />
      ) : (
        <div className="notice">
          <p>Здесь пока пусто. Нажмите ♥ на обложке фильма, чтобы сохранить его.</p>
          <Link to="/best" className="btn btn-primary">Открыть подборку</Link>
        </div>
      )}
    </div>
  );
};

export default Favorites;
