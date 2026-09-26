import { ShieldIcon } from './Icons';

// Напоминание перед вводом пароля. Показывает реальный адрес страницы, чтобы
// посетитель сверил его с адресной строкой и заметил поддельный домен.
export default function AntiPhishing() {
  const { protocol, host } = window.location;
  return (
    <aside className="safety-note">
      <ShieldIcon size={20} />
      <div>
        <p><strong>Проверьте адрес сайта перед вводом пароля.</strong></p>
        <p>
          Вы на <code>{host}</code>{protocol === 'https:' ? ' — соединение защищено.' : '.'} Фишинговые копии
          используют похожие адреса с лишними буквами или дефисами. Мы никогда не просим пароль в письмах,
          мессенджерах и по телефону.
        </p>
      </div>
    </aside>
  );
}
