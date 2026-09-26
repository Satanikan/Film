import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Header from './Components/Header';
import Footer from './Components/Footer';
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
  return (
    <>
      <a className="skip-link" href="#main">Перейти к содержимому</a>
      <ScrollToTop />
      <Header />
      <main id="main" className="site-main">
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
      </main>
      <Footer />
    </>
  );
}
