import { Link } from '../lib/links';
import ExternalLink from './ExternalLink';
import { ShieldIcon } from './Icons';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>
          <p className="footer-brand">Walking<span>Dead</span></p>
          <p className="muted">
            Фан-сайт о «Ходячих мертвецах» и онлайн-кинотеатр. Полные фильмы — только из общественного
            достояния, видео предоставляет <ExternalLink href="https://archive.org/details/feature_films">Internet Archive</ExternalLink>.
          </p>
        </div>
        <nav className="footer-links" aria-label="Служебные ссылки">
          <Link to="/error">Сообщить об ошибке</Link>
          <Link to="/favorites">Избранное</Link>
          {import.meta.env.VITE_DEMO ? (
            <ExternalLink href="https://github.com/satanikan/film/security/advisories/new">Сообщить об уязвимости</ExternalLink>
          ) : (
            <a href="/.well-known/security.txt">Сообщить об уязвимости</a>
          )}
        </nav>
        <p className="footer-safety">
          <ShieldIcon size={18} />
          Мы никогда не просим пароль в письмах, мессенджерах или по телефону. Вводите его только на этом сайте.
        </p>
      </div>
    </footer>
  );
}
