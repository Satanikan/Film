import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="container page">
    <div className="notice notice-center">
      <p className="big-code">404</p>
      <h1>Страница не найдена</h1>
      <p className="muted">Похоже, здесь прошли ходячие. Вернитесь на главную.</p>
      <Link to="/" className="btn btn-primary">На главную</Link>
    </div>
  </div>
);

export default NotFound;
