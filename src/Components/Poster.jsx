import { useState } from 'react';
import { posterUrl } from '../data/catalog';

// Обложка с запасным вариантом: если картинка не загрузилась, рисуем
// аккуратную «афишу» с названием вместо пустого прямоугольника.
export default function Poster({ id, title, year, src }) {
  const [failed, setFailed] = useState(false);
  const hue = [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

  if (failed) {
    return (
      <div className={`poster poster-fallback hue-${hue % 12}`} role="img" aria-label={title}>
        <span className="poster-fallback-title">{title}</span>
        {year && <span className="poster-fallback-year">{year}</span>}
      </div>
    );
  }
  return (
    <img
      className="poster"
      src={src ?? posterUrl(id)}
      alt={title}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
