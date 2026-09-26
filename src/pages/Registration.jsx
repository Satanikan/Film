import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from '../lib/links';
import PasswordField from '../Components/PasswordField';
import AntiPhishing from '../Components/AntiPhishing';
import { useAuth } from '../lib/auth';
import { LIMITS, validateLogin, validateName, validatePassword } from '../../shared/validation.js';

function validate(form) {
  const errors = {
    name: validateName(form.name),
    login: validateLogin(form.login),
    password: validatePassword(form.password, form.login),
    confirm: form.confirm !== form.password ? 'Пароли не совпадают' : null,
  };
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v));
}

const Registration = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', login: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await register({ name: form.name.trim(), login: form.login, password: form.password });
      navigate('/', { replace: true });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container page auth-page">
      <form className="auth-card" onSubmit={submit} noValidate>
        <h1>Регистрация</h1>
        <p className="muted">Аккаунт нужен, чтобы оставлять сообщения и сохранять профиль.</p>

        {serverError && <p className="form-error" role="alert">{serverError}</p>}

        <div className="field">
          <label htmlFor="name">Имя</label>
          <input id="name" value={form.name} onChange={(e) => set('name')(e.target.value)} autoComplete="nickname"
            maxLength={LIMITS.nameMax} aria-invalid={Boolean(errors.name)} required />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>
        <div className="field">
          <label htmlFor="login">Логин</label>
          <input id="login" value={form.login} onChange={(e) => set('login')(e.target.value)} autoComplete="username"
            autoCapitalize="none" spellCheck={false} maxLength={32} aria-invalid={Boolean(errors.login)} required />
          {errors.login ? <p className="field-error">{errors.login}</p> : <p className="hint">Латиница, цифры, точка, дефис или _</p>}
        </div>
        <PasswordField id="password" label="Пароль" value={form.password} onChange={set('password')}
          autoComplete="new-password" error={errors.password} showStrength />
        <PasswordField id="confirm" label="Повторите пароль" value={form.confirm} onChange={set('confirm')}
          autoComplete="new-password" error={errors.confirm} />

        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
        </button>
        <p className="auth-switch">Уже есть аккаунт? <Link to="/sign">Войти</Link></p>
      </form>
      <AntiPhishing />
    </div>
  );
};

export default Registration;
