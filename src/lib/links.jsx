import { Link as RouterLink, NavLink as RouterNavLink, useMatch, useNavigate, useResolvedPath } from 'react-router-dom';

// В превью на claude.ai страница-хозяин перехватывает клики по любому <a href>
// и уводит окно по этому адресу, поэтому внутри превью был чёрный экран.
// В демо-сборке внутренние ссылки рисуются без href и переключают страницу
// через роутер. В обычной сборке это стандартные Link и NavLink.
const DEMO = Boolean(import.meta.env.VITE_DEMO);

function useDemoLink(to, onClick) {
  const navigate = useNavigate();
  const go = (e) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    e.preventDefault();
    navigate(to);
  };
  return {
    role: 'link',
    tabIndex: 0,
    onClick: go,
    onKeyDown: (e) => {
      if (e.key === 'Enter') go(e);
    },
  };
}

// eslint-disable-next-line no-unused-vars
function DemoLink({ to, replace, children, onClick, ...rest }) {
  return <a {...rest} {...useDemoLink(to, onClick)}>{children}</a>;
}

function DemoNavLink({ to, end, className, children, onClick, ...rest }) {
  const { pathname } = useResolvedPath(to);
  const isActive = Boolean(useMatch({ path: pathname, end: Boolean(end) }));
  const link = useDemoLink(to, onClick);
  const cls = typeof className === 'function' ? className({ isActive }) : [className, isActive && 'active'].filter(Boolean).join(' ');
  return (
    <a {...rest} {...link} className={cls} aria-current={isActive ? 'page' : undefined}>
      {children}
    </a>
  );
}

export const Link = DEMO ? DemoLink : RouterLink;
export const NavLink = DEMO ? DemoNavLink : RouterNavLink;
