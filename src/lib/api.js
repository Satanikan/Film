import { ApiError } from './apiError';
import { demoApi } from './demoApi';

export { ApiError };

// Обёртка над fetch для нашего API. Cookie отправляются только на свой домен,
// тело всегда JSON — сервер отклоняет другие форматы (защита от CSRF).
export async function api(path, { method = 'GET', body, signal } = {}) {
  if (import.meta.env.VITE_DEMO) return demoApi(path, { method, body });
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      signal,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
      },
      body: method !== 'GET' ? JSON.stringify(body ?? {}) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Нет связи с сервером. Проверьте подключение к интернету', 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // пустой или не-JSON ответ
  }
  if (!res.ok) throw new ApiError(data?.error || 'Что-то пошло не так, попробуйте ещё раз', res.status);
  return data;
}
