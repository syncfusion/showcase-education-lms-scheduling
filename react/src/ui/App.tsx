// App: shell + lazy routes + header actions (reset, theme) + AI drawer mount.

import { Suspense, lazy, useCallback, type MouseEvent } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarDays, ClipboardList, FolderOpen, GraduationCap, Info, LayoutDashboard,
  Moon, RotateCcw, Sun, Sparkles
} from 'lucide-react';
import { TooltipComponent } from '@syncfusion/ej2-react-popups';
import { AppShell, type NavItem } from './shell/AppShell';
import { useApp } from '../application/app-context';
import { useThemeBundle } from './theme-bundle';
import { RouteSkeleton } from './route-skeletons';
import { AiDrawer } from './ai-drawer';

const BASE = import.meta.env.BASE_URL; // /education-lms-scheduling/react/
const routes = ['dashboard', 'schedule', 'plan', 'content', 'students'] as const;
type RouteId = (typeof routes)[number];

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Plan = lazy(() => import('./pages/Plan'));
const Content = lazy(() => import('./pages/Content'));
const Students = lazy(() => import('./pages/Students'));

const NAV: Array<NavItem & { route: RouteId }> = [
  { id: 'dashboard', label: 'Dashboard', href: `${BASE}dashboard`, icon: LayoutDashboard, route: 'dashboard' },
  { id: 'schedule', label: 'Schedule', href: `${BASE}schedule`, icon: CalendarDays, route: 'schedule' },
  { id: 'plan', label: 'Course Plan', href: `${BASE}plan`, icon: ClipboardList, route: 'plan' },
  { id: 'content', label: 'Content & Materials', href: `${BASE}content`, icon: FolderOpen, route: 'content' },
  { id: 'students', label: 'Students', href: `${BASE}students`, icon: GraduationCap, route: 'students' }
];

function currentRoute(pathname: string): RouteId {
  const seg = pathname.split('/').filter(Boolean).pop();
  const found = routes.find(r => r === seg);
  return found ?? 'dashboard';
}

const PAGE_LABEL: Record<RouteId, string> = {
  dashboard: 'Dashboard', schedule: 'Class Schedule', plan: 'Term Course Plan',
  content: 'Content & Materials', students: 'Student Roster'
};

const RESET_INFO = 'Changes made in this session are reset.';

// AI drawer pages. Content & Materials does not show the drawer.
const AI_PAGES: ReadonlySet<RouteId> = new Set<RouteId>(['dashboard', 'schedule', 'plan', 'students']);

export function App() {
  const { theme, setTheme, reset } = useApp();
  useThemeBundle(theme);
  const location = useLocation();
  const navigate = useNavigate();
  const current = currentRoute(location.pathname);

  const onNavigate = useCallback((id: string, event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const item = NAV.find(n => n.id === id);
    if (item) navigate(item.href.replace(BASE, '/'));
  }, [navigate]);

  // The shell stays mounted. Lazy-chunk loads and the short fixture delay both use the
  // same Syncfusion skeleton inside the content area.

  return (
    <>
      <AppShell
        appName="Education LMS"
        appSubtitle="Course Scheduling Portal"
        logo={<GraduationCap size={24} aria-hidden="true" />}
        items={NAV}
        currentId={current}
        onNavigate={onNavigate}
        storageKey="edu-lms-nav-collapsed"
        headerStart={
          <span className="app-header-title">
          </span>
        }
        headerEnd={
          <div className="app-header-actions">
            {/* Info is a sibling control, not a nested button, so a tap explains the
                reset without running it. BottomRight keeps the tip inside a phone viewport. */}
            <div className="app-header-reset">
              <button type="button" className="app-header-button app-header-reset-action" onClick={reset} title="Reset demo data" aria-label="Reset demo data">
                <RotateCcw size={16} aria-hidden="true" />
                <span className="app-header-reset-label">Reset demo data</span>
              </button>
              <TooltipComponent
                content={RESET_INFO}
                position="BottomRight"
                opensOn="Hover Focus Click"
                showTipPointer
                windowCollision
                width="220px"
                cssClass="app-header-reset-tip"
              >
                <button type="button" className="app-header-button app-header-reset-info" aria-label={RESET_INFO}>
                  <Info size={16} aria-hidden="true" />
                </button>
              </TooltipComponent>
            </div>
            <button
              type="button"
              className="app-header-button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
            </button>
          </div>
        }
      >
        <Suspense fallback={<RouteSkeleton route={current} />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/content" element={<Content />} />
            <Route path="/students" element={<Students />} />
          </Routes>
        </Suspense>
      </AppShell>
      {AI_PAGES.has(current) ? (
        <AiDrawer key="ai-drawer" page={current} label={PAGE_LABEL[current]} />
      ) : null}
    </>
  );
}

export const aiFabIcon = Sparkles; // exported for the drawer's FAB