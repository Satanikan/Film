import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { LIMITS, REPORT_TYPES, validateReport } from '../../shared/validation.js';

const ReportError = () => {
  const [params] = useSearchParams();
  const initialPage = params.get('page') ?? '';
  const [form, setForm] = useState({
    type: initialPage.startsWith('/watch/') ? 'video' : 'site',
    message: '',
    page: /^\/[\w\-./?=&%]{0,200}$/.test(initialPage) ? initialPage : '',
    website: '',
  });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const problem = validateReport(form);
    if (problem) {
      setError(problem);
      return;
    }
    setStatus('sending');
    setError('');
    try {
      await api('/reports', { method: 'POST', body: form });
      setStatus('sent');
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  };

  if (status === 'sent') {
    return (
      <div className="container page auth-page">
        <div className="auth-card notice-center">
          <h1>Спасибо!</h1>
          <p className="muted">Сообщение отправлено, мы посмотрим его в ближайшее время.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container page auth-page">
      <form className="auth-card" onSubmit={submit} noValidate>
        <h1>Сообщить об ошибке</h1>
        <p className="muted">Не работает видео, опечатка в описании или подозрительная ссылка? Напишите нам.</p>
        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="field">
          <label htmlFor="type">Что случилось</label>
          <select id="type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {Object.entries(REPORT_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="message">Описание</label>
          <textarea id="message" rows={6} value={form.message} maxLength={LIMITS.reportMax}
            onChange={(e) => setForm({ ...form, message: e.target.value })} required />
          <p className="hint">{form.message.length} / {LIMITS.reportMax}</p>
        </div>
        {form.page && <p className="hint">Страница: <code>{form.page}</code></p>}

        {/* Ловушка для ботов: поле скрыто от людей и программ чтения экрана. */}
        <div className="hp" aria-hidden="true">
          <label htmlFor="website">Сайт</label>
          <input id="website" tabIndex={-1} autoComplete="off" value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })} />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={status === 'sending'}>
          {status === 'sending' ? 'Отправляем…' : 'Отправить'}
        </button>
      </form>
    </div>
  );
};

export default ReportError;
