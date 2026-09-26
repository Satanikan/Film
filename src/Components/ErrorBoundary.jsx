import { Component } from 'react';

// Если страница упала при отрисовке, показываем сообщение вместо пустого экрана.
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="container page">
        <div className="notice notice-center">
          <h1>Не удалось показать страницу</h1>
          <p className="muted">Произошла ошибка. Попробуйте вернуться на главную.</p>
          <button type="button" className="btn btn-primary" onClick={this.props.onReset}>На главную</button>
        </div>
      </div>
    );
  }
}
