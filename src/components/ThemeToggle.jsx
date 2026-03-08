import './ThemeToggle.css';

function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      <span className={`theme-icon ${theme}`}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </span>
    </button>
  );
}

export default ThemeToggle;
