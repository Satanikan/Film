import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/inter';
import '@fontsource-variable/oswald';
import App from './App.jsx';
import { AuthProvider } from './lib/auth';
import './index.css';

// Если сайт всё-таки открыли внутри чужого фрейма (например, на хостинге без
// заголовков из public/_headers) — не показываем его там: защита от clickjacking.
if (window.top !== window.self) {
  try {
    window.top.location.replace(window.location.href);
  } catch {
    document.documentElement.hidden = true;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
