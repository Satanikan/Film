import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Header from './Components/Header';
import Footer from './Components/Footer';
import ErrorBoundary from './Components/ErrorBoundary';
import Home from './pages/Home';
import BestTitle from './pages/BestTitle';
import Films from './pages/Films';
import Anime from './pages/Anime';
import Serials from './pages/Serials';
import Watch from './pages/Watch';
import Search from './pages/Search';
import Favorites from './pages/Favorites';
import ReportError from './pages/Error';
import Registration from './pages/Registration';
import Sign from './pages/Sign';
import NotFound from './pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return (
    <>
      {!import.meta.env.VITE_DEMO && <a className="skip-link" href="#main">Перейти к содержимому</a>}
      {import.meta.env.VITE_DEMO && (
        <p className="demo-bar">
          Демо-версия: видео, живой каталог и настоящий вход работают при запуске сайта на сервере.
          Здесь аккаунт хранится только в вашем браузере, не вводите настоящий пароль.
        </p>
      )}
      <ScrollToTop />
      <Header />
      <main id="main" className="site-main">
        <ErrorBoundary key={pathname} onReset={() => navigate('/')}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/best" element={<BestTitle />} />
          <Route path="/films" element={<Films />} />
          <Route path="/anime" element={<Anime />} />
          <Route path="/serials" element={<Serials />} />
          <Route path="/watch/:id" element={<Watch />} />
          <Route path="/search" element={<Search />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/error" element={<ReportError />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/sign" element={<Sign />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </ErrorBoundary>
      </main>
      <Footer />
    </>
  );
}
