import { ARCHIVE_ID_RE } from '../../shared/validation.js';
import { embedUrl } from '../data/catalog';

// Встроенный плеер Internet Archive. Во фрейм попадает только адрес archive.org
// с проверенным идентификатором, а sandbox ограничивает, что может делать фрейм.
export default function Player({ id, title }) {
  if (!ARCHIVE_ID_RE.test(id)) {
    return <div className="player player-error">Некорректная ссылка на видео</div>;
  }
  return (
    <div className="player">
      <iframe
        src={embedUrl(id)}
        title={`Плеер: ${title}`}
        allow="fullscreen; autoplay; picture-in-picture"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-presentation"
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    </div>
  );
}
