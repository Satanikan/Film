import { useCallback, useEffect, useState } from 'react';

const KEY = 'film:favorites';
const EVENT = 'film:favorites-change';

function read() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(list) ? list.filter((f) => f && typeof f.id === 'string' && typeof f.title === 'string') : [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // приватный режим или переполнено хранилище — избранное просто не сохранится
  }
  window.dispatchEvent(new Event(EVENT));
}

// Избранное хранится в браузере посетителя и синхронизируется между вкладками.
export function useFavorites() {
  const [favorites, setFavorites] = useState(read);

  useEffect(() => {
    const sync = () => setFavorites(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const isFavorite = useCallback((id) => favorites.some((f) => f.id === id), [favorites]);

  const toggle = useCallback((movie) => {
    const list = read();
    const exists = list.some((f) => f.id === movie.id);
    write(
      exists
        ? list.filter((f) => f.id !== movie.id)
        : [{ id: movie.id, title: movie.title, year: movie.year ?? null }, ...list].slice(0, 200),
    );
  }, []);

  return { favorites, isFavorite, toggle };
}
