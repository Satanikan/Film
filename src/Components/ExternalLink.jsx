import { ExternalIcon } from './Icons';

// Ссылка на внешний сайт: только https, в новой вкладке и с rel="noopener noreferrer" —
// открытая страница не получит доступ к нашей вкладке (защита от tabnabbing-фишинга).
export default function ExternalLink({ href, children, className = '' }) {
  let safe = null;
  try {
    const url = new URL(href);
    if (url.protocol === 'https:') safe = url.href;
  } catch {
    safe = null;
  }
  if (!safe) return <span className={className}>{children}</span>;
  return (
    <a className={`external ${className}`} href={safe} target="_blank" rel="noopener noreferrer">
      {children}
      <ExternalIcon size={14} />
    </a>
  );
}
