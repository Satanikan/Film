import { Link } from 'react-router-dom';
import Banner from '../Images/logo_2.jpg';
import Data from '../Components/Data';
import SeasonCard from '../Components/SeasonCard';
import { MovieGrid } from '../Components/MovieCard';
import { FEATURED } from '../data/catalog';
import { PlayIcon } from '../Components/Icons';

const zombieClassics = FEATURED.filter((f) => f.genres.includes('Ужасы')).slice(0, 6).map((f) => ({ ...f, featured: true }));

const Home = () => (
  <>
    <section className="hero">
      {!import.meta.env.VITE_DEMO && <img className="hero-bg" src={Banner} alt="" aria-hidden="true" />}
      <div className="container hero-content">
        <p className="eyebrow">Фан-сайт и онлайн-кинотеатр</p>
        <h1 className="hero-title">Ходячие мертвецы</h1>
        <p className="hero-text">
          Всё о сериале, который сделал зомби-апокалипсис главной драмой десятилетия, и полные фильмы о живых
          мертвецах, которые можно смотреть бесплатно и легально.
        </p>
        <div className="hero-actions">
          <Link to="/watch/NightOfTheLivingDeadHD" className="btn btn-primary btn-lg">
            <PlayIcon size={18} /> Смотреть «Ночь живых мертвецов»
          </Link>
          <a href="#seasons" className="btn btn-ghost btn-lg">Все сезоны</a>
        </div>
      </div>
    </section>

    <div className="container page">
      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Зомби-классика целиком</h2>
          <Link to="/best" className="more-link">Вся подборка →</Link>
        </div>
        <p className="muted section-lead">Фильмы, с которых начался жанр. Их права истекли, поэтому они в общественном достоянии.</p>
        <MovieGrid movies={zombieClassics} />
      </section>

      <section className="section about" aria-labelledby="about-title">
        <div className="about-text">
          <h2 id="about-title" className="section-title">О сериале</h2>
          <p>
            <strong>«Ходячие мертвецы»</strong> — американский постапокалиптический сериал с элементами триллера и
            ужасов. Его создал Фрэнк Дарабонт, адаптировав одноимённые комиксы Роберта Киркмана, Тони Мура и
            Чарли Адларда.
          </p>
          <p>
            Сериал выходил на AMC с 2010 по 2022 год: 11 сезонов и 177 эпизодов. Он собрал огромное фан-сообщество,
            породил несколько спин-оффов и номинировался на «Золотой глобус», «Сатурн» и премию Гильдии сценаристов США.
          </p>
          <dl className="facts">
            <div><dt>Сезонов</dt><dd>11</dd></div>
            <div><dt>Эпизодов</dt><dd>177</dd></div>
            <div><dt>Годы</dt><dd>2010–2022</dd></div>
          </dl>
        </div>
      </section>

      <section className="section" id="seasons">
        <h2 className="section-title">Все сезоны</h2>
        <p className="muted section-lead">
          Полные серии «Ходячих мертвецов» защищены авторским правом и доступны только в лицензионных онлайн-кинотеатрах.
        </p>
        <div className="season-grid">
          {Data.map((season) => <SeasonCard key={season.id} title={season.title} url={season.url} />)}
        </div>
      </section>
    </div>
  </>
);

export default Home;
