'use client';

/**
 * components/layout/area-theme.tsx
 * Full-system Light / Dark Mode Provider & Switcher for the OKN Web3 Dashboard.
 *
 * Persists theme in `localStorage.okn_theme` and synchronizes:
 *  1. `document.documentElement` (`data-theme="light" | "dark"` and class `light | dark`)
 *  2. `document.body` (`class="light | dark"`)
 *  3. CSS variables across all components, cards, tables, and modal portals.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';

export type Theme = 'light' | 'dark';

interface AreaThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const AreaThemeContext = createContext<AreaThemeContextValue>({
  theme: 'dark',
  toggle: () => {},
  setTheme: () => {},
});

function applyThemeToDOM(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;

  root.setAttribute('data-theme', theme);

  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    body.classList.add('dark');
    body.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    body.classList.remove('dark');
    body.classList.add('light');
  }
}

export function AreaThemeProvider({
  area,
  children,
}: {
  area: 'app' | 'admin';
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = (window.localStorage.getItem('okn_theme') ||
      window.localStorage.getItem(`okn-theme:${area}`)) as Theme | null;
    const initial: Theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
    setThemeState(initial);
    applyThemeToDOM(initial);
  }, [area]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('okn_theme', newTheme);
        window.localStorage.setItem(`okn-theme:${area}`, newTheme);
        applyThemeToDOM(newTheme);
      }
    },
    [area],
  );

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('okn_theme', next);
        window.localStorage.setItem(`okn-theme:${area}`, next);
        applyThemeToDOM(next);
      }
      return next;
    });
  }, [area]);

  return (
    <AreaThemeContext.Provider value={{ theme, toggle, setTheme }}>
      <div className={`w-full ${theme === 'dark' ? 'dark' : 'light'}`}>
        {children}
      </div>
    </AreaThemeContext.Provider>
  );
}

export function useDarkClass(): 'dark' | undefined {
  const { theme } = useContext(AreaThemeContext);
  return theme === 'dark' ? 'dark' : undefined;
}

export function useTheme() {
  return useContext(AreaThemeContext);
}

/** 40x40 Circular Theme Toggle matching the reference live design */
export function AreaThemeToggle() {
  const { theme, toggle } = useContext(AreaThemeContext);
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--s2)] text-[var(--tx)] transition-all duration-200 hover:border-[#7A12F5]/50 hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
    >
      {isLight ? (
        <Moon className="size-[18px] text-[var(--tx)] transition-transform duration-200" />
      ) : (
        <Sun className="size-[18px] text-[#7A12F5] transition-transform duration-200" />
      )}
    </button>
  );
}

/** Segmented Light / Dark pill used in menus or footers */
export function AreaThemeSwitch() {
  const { theme, setTheme } = useContext(AreaThemeContext);
  const t = useTranslations('dashboard.theme');

  return (
    <div
      role="group"
      aria-label={t('appearance')}
      className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--s2)] p-1"
    >
      <button
        type="button"
        aria-pressed={theme === 'light'}
        onClick={() => setTheme('light')}
        className={`flex size-7 items-center justify-center rounded-full transition-colors ${
          theme === 'light'
            ? 'bg-[#7A12F5] text-white shadow-sm'
            : 'text-[var(--mut)] hover:text-[var(--tx)]'
        }`}
      >
        <Sun className="size-4" />
      </button>
      <button
        type="button"
        aria-pressed={theme === 'dark'}
        onClick={() => setTheme('dark')}
        className={`flex size-7 items-center justify-center rounded-full transition-colors ${
          theme === 'dark'
            ? 'bg-[#7A12F5] text-white shadow-sm'
            : 'text-[var(--mut)] hover:text-[var(--tx)]'
        }`}
      >
        <Moon className="size-4" />
      </button>
    </div>
  );
}
