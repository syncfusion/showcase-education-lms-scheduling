// App context: SessionStore, mock assistant (IoC), theme — reacts to store changes.

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { SessionStore, type AssistantProvider, type SessionSnapshot } from './session-store';
import { MockAssistantProvider } from './assistant';
import { SystemClock } from './clock';
import fixtures from '../data/fixtures.json';
import { buildSnapshot as buildSnapshotFor } from './snapshot';

export type Theme = 'light' | 'dark';

interface AppContextValue {
  store: SessionStore;
  assistant: AssistantProvider;
  theme: Theme;
  setTheme: (t: Theme) => void;
  buildSnapshot: (page: string, prompt: string) => SessionSnapshot;
  reset: () => void;
  revision: number;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('edu-lms-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  // Store + provider + clock created once; revision re-renders subscribers.
  const [revision, setRevision] = useState(0);
  const value = useMemo(() => {
    const store = new SessionStore(fixtures as never);
    const assistant = new MockAssistantProvider();
    const clock = new SystemClock();
    void clock; // term-week resolution used by pages; snapshot pulls counts from the store
    const unsubscribe = store.subscribe(() => setRevision(r => r + 1));
    void unsubscribe; // live for app lifetime
    const buildSnapshot = (page: string, prompt: string): SessionSnapshot =>
      buildSnapshotFor(store, page, prompt);
    return {
      store, assistant, theme, setTheme, buildSnapshot,
      reset: () => store.reset(),
      revision: 0
    } satisfies AppContextValue;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep html data-theme in step with state (persists via localStorage on change).
  const applyTheme = (t: Theme) => {
    setTheme(t);
    localStorage.setItem('edu-lms-theme', t);
    document.documentElement.setAttribute('data-theme', t);
  };
  useMemo(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  return (
    <AppContext.Provider value={{ ...value, theme, setTheme: applyTheme, revision }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp outside AppProvider');
  return ctx;
}