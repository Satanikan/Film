import { useState } from 'react';

export default function SeasonCard({ title, url }) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className="season-card">
      {failed ? (
        <div className="poster poster-fallback hue-0" aria-hidden="true" />
      ) : (
        <img src={url} alt={`Ходячие мертвецы — ${title}`} loading="lazy" decoding="async"
          referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      )}
      <figcaption>{title}</figcaption>
    </figure>
  );
}
