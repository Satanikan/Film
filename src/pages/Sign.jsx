import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Link } from '../lib/links';
import PasswordField from '../Components/PasswordField';
import AntiPhishing from '../Components/AntiPhishing';
import { safeRedirect, useAuth } from '../lib/auth';

const Sign = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.login || !form.password) {
      setError('Введите логин и пароль');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await login(form.login.trim(), form.password);
      navigate(safeRedirect(params.get('next')), { replace: true });
    } catch (err) {
      setError(err.message);
      setForm((f) => ({ ...f, password: '' }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container page auth-page">
      <form className="auth-card" onSubmit={submit} noValidate>
        <h1>Вход</h1>
        <p className="muted">Рады видеть снова! Войдите, чтобы продолжить.</p>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="field">
          <label htmlFor="login">Логин</label>
          <input
            id="login"
            value={form.login}
            onChange={(e) => setForm({ ...form, login: e.target.value })}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={32}
            required
          />
        </div>
        <PasswordField
          id="password"
          label="Пароль"
          value={form.password}
          onChange={(password) => setForm({ ...form, password })}
          autoComplete="current-password"
        />

        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Входим…' : 'Войти'}
        </button>
        <p className="auth-switch">Нет аккаунта? <Link to="/registration">Зарегистрируйтесь</Link></p>
      </form>
      <AntiPhishing />
    </div>
  );
};

export default Sign;
