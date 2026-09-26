import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useFavorites } from '../lib/favorites';
import { CloseIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from './Icons';
import { LIMITS } from '../../shared/validation.js';

const NAV = [
  { to: '/', label: 'Главная', end: true },
  { to: '/best', label: 'Лучшее' },
  { to: '/films', label: 'Фильмы' },
  { to: '/anime', label: 'Анимация' },
  { to: '/serials', label: 'Сериалы' },
];

export default function Header() {
  const { user, logout } = useAuth();
  const { favorites } = useFavorites();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  const submit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="site-header">
      <div className="header-inner container">
        <Link to="/" className="logo" aria-label="Walking Dead — на главную">
          <span className="logo-mark">W</span>
          <span className="logo-text">Walking<span>Dead</span></span>
        </Link>

        <button
          type="button"
          className="icon-btn menu-toggle"
          aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>

        <div id="main-nav" className={`header-panel ${open ? 'is-open' : ''}`}>
          <nav aria-label="Основное меню">
            <ul className="nav-list">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end} className="nav-link">{item.label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <form className="search" role="search" onSubmit={submit}>
            <SearchIcon size={18} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск фильмов…"
              aria-label="Поиск по сайту"
              maxLength={LIMITS.searchMax}
              enterKeyHint="search"
            />
          </form>

          <div className="header-actions">
            <NavLink to="/favorites" className="icon-btn fav-link" aria-label={`Избранное: ${favorites.length}`} title="Избранное">
              <HeartIcon />
              {favorites.length > 0 && <span className="counter">{favorites.length}</span>}
            </NavLink>
            {user ? (
              <div className="user-box">
                <span className="user-name"><UserIcon size={18} />{user.name}</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>Выйти</button>
              </div>
            ) : (
              <>
                <Link to="/sign" className="btn btn-ghost btn-sm">Вход</Link>
                <Link to="/registration" className="btn btn-primary btn-sm">Регистрация</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
