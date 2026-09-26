import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import '@fontsource-variable/inter';
import '@fontsource-variable/oswald';
import App from './App.jsx';
import { AuthProvider } from './lib/auth';
import './index.css';

// Демо-версия (npm run build:demo) живёт внутри превью, поэтому ей нужен
// роутер без адресной строки и отключённая защита от фреймов.
const DEMO = Boolean(import.meta.env.VITE_DEMO);
const Router = DEMO ? MemoryRouter : BrowserRouter;

// Если сайт всё-таки открыли внутри чужого фрейма (например, на хостинге без
// заголовков из public/_headers) — не показываем его там: защита от clickjacking.
if (!DEMO && window.top !== window.self) {
  try {
    window.top.location.replace(window.location.href);
  } catch {
    document.documentElement.hidden = true;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </StrictMode>,
);
