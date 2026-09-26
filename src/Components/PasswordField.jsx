import { useState } from 'react';
import { EyeIcon } from './Icons';
import { LIMITS, passwordStrength } from '../../shared/validation.js';

const LABELS = ['Очень слабый', 'Слабый', 'Средний', 'Хороший', 'Надёжный'];

export default function PasswordField({ id, label, value, onChange, autoComplete, error, showStrength = false }) {
  const [visible, setVisible] = useState(false);
  const strength = passwordStrength(value);

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-with-action">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          // autocomplete помогает менеджеру паролей: он подставит пароль только
          // на настоящем домене и «промолчит» на фишинговой копии сайта.
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          maxLength={LIMITS.passwordMax}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          required
        />
        <button
          type="button"
          className="input-action"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
          aria-pressed={visible}
        >
          <EyeIcon size={18} off={visible} />
        </button>
      </div>
      {showStrength && value && (
        <div className={`strength strength-${strength}`} aria-live="polite">
          <span className="strength-bar"><span /></span>
          <span className="strength-label">{LABELS[strength]}</span>
        </div>
      )}
      {error && <p id={`${id}-error`} className="field-error">{error}</p>}
    </div>
  );
}
