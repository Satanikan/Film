import { ARCHIVE_ID_RE } from '../../shared/validation.js';
import { archivePageUrl, embedUrl } from '../data/catalog';
import ExternalLink from './ExternalLink';
import { PlayIcon } from './Icons';

// Встроенный плеер Internet Archive. Во фрейм попадает только адрес archive.org
// с проверенным идентификатором, а sandbox ограничивает, что может делать фрейм.
export default function Player({ id, title }) {
  if (!ARCHIVE_ID_RE.test(id)) {
    return <div className="player player-error">Некорректная ссылка на видео</div>;
  }
  if (import.meta.env.VITE_DEMO) {
    return (
      <div className="player player-demo">
        <span className="player-demo-icon" aria-hidden="true"><PlayIcon size={34} /></span>
        <p>В демо-версии видео не встраивается. На сайте здесь будет плеер Internet Archive.</p>
        <ExternalLink href={archivePageUrl(id)} className="btn btn-primary">Смотреть «{title}» на archive.org</ExternalLink>
      </div>
    );
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
