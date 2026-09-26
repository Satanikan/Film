import { useState } from 'react';
import { MovieGrid } from '../Components/MovieCard';
import { FEATURED } from '../data/catalog';

const all = FEATURED.map((f) => ({ ...f, featured: true }));
const genres = ['Все', ...new Set(FEATURED.flatMap((f) => f.genres))];

const BestTitle = () => {
  const [genre, setGenre] = useState('Все');
  const movies = genre === 'Все' ? all : all.filter((m) => m.genres.includes(genre));

  return (
    <div className="container page">
      <header className="page-head">
        <h1>Лучшее</h1>
        <p className="lead">Проверенная подборка классики, которую можно посмотреть полностью прямо на сайте.</p>
      </header>
      <div className="chips" role="group" aria-label="Жанр">
        {genres.map((g) => (
          <button key={g} type="button" className={`chip ${g === genre ? 'is-active' : ''}`} aria-pressed={g === genre} onClick={() => setGenre(g)}>
            {g}
          </button>
        ))}
      </div>
      <MovieGrid movies={movies} />
    </div>
  );
};

export default BestTitle;
