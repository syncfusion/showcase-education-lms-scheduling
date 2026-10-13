// Dashboard: KPI Cards, three Charts, DashboardLayout tiles, ListView, DropDownList filter.

import { memo, useMemo, useRef, useState, useEffect } from 'react';
import {
  ChartComponent, LineSeries, BarSeries, AreaSeries, Category, Legend, Tooltip,
  Inject, SeriesDirective, SeriesCollectionDirective, DataLabel
} from '@syncfusion/ej2-react-charts';
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import { ListViewComponent } from '@syncfusion/ej2-react-lists';
import { DashboardLayoutComponent } from '@syncfusion/ej2-react-layouts';
import { Users, CalendarCheck, Trophy, AlertTriangle } from 'lucide-react';
import { useApp, type Theme } from '../../application/app-context';
import { DashboardSkeleton } from '../route-skeletons';
import { paletteFor } from '../../adapters/palette';
import {
  TRACKS, attendanceBand, completionBand, enrollmentFilledBand,
  type Track, type Band, type SessionType
} from '../../domain/entities';

const WEEK_LABELS = Array.from({ length: 12 }, (_, i) => `W${i + 1}`);
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TYPE_LABEL: Record<SessionType, string> = {
  lecture: 'Lecture',
  lab: 'Lab',
  seminar: 'Seminar',
  'office-hours': 'Office hours',
};

function formatClock(minutes: number): string {
  const date = new Date(2026, 0, 1, Math.floor(minutes / 60), minutes % 60);
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);
}

function roomCode(name: string, id: string): string {
  const token = name.trim().split(/\s+/).pop();
  return token && token !== name ? token : id.replace(/^room-/, '').toUpperCase();
}

interface WeekGlanceItem {
  id: string;
  text: string;
  day: string;
  time: string;
  type: SessionType;
  typeLabel: string;
  meta: string;
}

function weekTemplate(data: WeekGlanceItem) {
  return (
    <div className="week-glance-item">
      <span className="week-glance-time">{data.time}</span>
      <span className="week-glance-body">
        <span className="week-glance-title">{data.text}</span>
        <span className="week-glance-meta">{data.meta}</span>
      </span>
      <span className={`week-glance-chip week-glance-chip-${data.type}`}>{data.typeLabel}</span>
    </div>
  );
}

function weekGroupTemplate(data: { text?: string; items?: WeekGlanceItem[] }) {
  const label = data.items?.[0]?.day || data.text || '';
  return <div className="week-glance-day">{label}</div>;
}

// 12 columns, two tiles per row. sizeY 3 keeps a chart readable.
// mobilePanelHeight is a fraction of (viewport width / cellAspectRatio) used only under the media query.
const DASHBOARD_PANELS = [
  { id: 'tile-attendance', row: 0, col: 0, sizeX: 6, sizeY: 3, minSizeX: 4, minSizeY: 2, mobilePanelHeight: 0.55 },
  { id: 'tile-completion', row: 0, col: 6, sizeX: 6, sizeY: 3, minSizeX: 4, minSizeY: 2, mobilePanelHeight: 0.55 },
  { id: 'tile-enrollment', row: 3, col: 0, sizeX: 6, sizeY: 3, minSizeX: 4, minSizeY: 2, mobilePanelHeight: 0.55 },
  { id: 'tile-this-week', row: 3, col: 6, sizeX: 6, sizeY: 3, minSizeX: 4, minSizeY: 2, mobilePanelHeight: 0.55 },
];

const DashboardTiles = memo(function DashboardTiles({ theme, revision }: { theme: Theme; revision: number }) {
  const { store } = useApp();
  const palette = paletteFor(theme);
  const attendanceChart = useRef<ChartComponent | null>(null);
  const completionChart = useRef<ChartComponent | null>(null);
  const enrollmentChart = useRef<ChartComponent | null>(null);
  const layoutRef = useRef<DashboardLayoutComponent | null>(null);

  const completionByTrack = useMemo(() => TRACKS.map(track => {
    const inTrack = store.students.filter(s => s.track === track);
    const avg = inTrack.length
      ? inTrack.reduce((n, s) => n + s.completionPct, 0) / inTrack.length : 0;
    return { track: track.split(' ')[0], completion: Math.round(avg * 10) / 10 };
  }), [store, revision]);

  const attendanceTrend = useMemo(() => {
    const aggregate = store.getAggregate();
    return Array.from({ length: 12 }, (_, i) => ({
      week: WEEK_LABELS[i],
      value: Math.max(60, aggregate.avgAttendance + (6 - i) * 1.8),
    }));
  }, [store, revision]);

  const weekItems = useMemo(() => store.sessions
    .filter(s => s.weekStartOffset === 0)
    .slice()
    .sort((a, b) => a.weekday - b.weekday || a.startMinutes - b.startMinutes)
    .map((s): WeekGlanceItem => {
      const instructor = store.instructors.find(i => i.id === s.instructorId);
      const room = store.rooms.find(r => r.id === s.roomId);
      return {
        id: s.id,
        text: s.subject,
        day: DAY_NAMES[s.weekday] ?? 'Weekday',
        time: `${formatClock(s.startMinutes)}–${formatClock(s.startMinutes + s.durationMinutes)}`,
        type: s.type,
        typeLabel: TYPE_LABEL[s.type],
        meta: [room ? roomCode(room.name, room.id) : roomCode('', s.roomId), instructor?.name ?? '']
          .filter(Boolean)
          .join(' · '),
      };
    }), [store, revision]);

  function refreshCharts() {
    attendanceChart.current?.refresh();
    completionChart.current?.refresh();
    enrollmentChart.current?.refresh();
  }

  // The shell drops the docked sidebar after the window resize event. The layout
  // measures that older width, so a desktop-to-phone resize leaves short panels.
  // Re-measure only when the content width actually changes.
  useEffect(() => {
    const parent = document.getElementById('overview-layout')?.parentElement;
    if (!parent) return;
    let lastWidth = parent.clientWidth;
    let frame = 0;
    let alive = true;
    const observer = new ResizeObserver(() => {
      const width = parent.clientWidth;
      if (width === lastWidth) return;
      lastWidth = width;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (!alive) return;
        layoutRef.current?.refresh();
        window.requestAnimationFrame(() => { if (alive) refreshCharts(); });
      });
    });
    observer.observe(parent);
    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [theme, revision]);

  return (
    <DashboardLayoutComponent
      id="overview-layout"
      ref={layoutRef}
      key={`${theme}-${revision}`}
      columns={12}
      cellSpacing={[16, 16]}
      cellAspectRatio={0.9}
      panels={DASHBOARD_PANELS}
      allowDragging
      allowResizing
      allowFloating={false}
      enablePersistence={false}
      mediaQuery="max-width: 767px"
      draggableHandle=".app-tile-drag"
      created={() => window.requestAnimationFrame(refreshCharts)}
      resizeStop={() => window.requestAnimationFrame(refreshCharts)}
    >
      <div id="tile-attendance" className="app-tile">
        <div className="e-panel-container">
          <div className="e-panel-content">
            <h2 className="app-tile-title app-tile-drag">Attendance trend <small>(target 85%)</small></h2>
            <ChartComponent
              ref={attendanceChart}
              theme={theme === 'dark' ? 'Tailwind3Dark' : 'Tailwind3'}
              key={`attendance-${theme}`}
              height="100%"
              primaryXAxis={{ valueType: 'Category', title: 'Week', labelRotation: 0, labelStyle: { color: palette.label }, titleStyle: { color: palette.axis } }}
              primaryYAxis={{ labelFormat: '{value}%', minimum: 50, maximum: 100, labelStyle: { color: palette.label }, titleStyle: { color: palette.axis } }}
              legendSettings={{ visible: true, background: palette.legendBg, textStyle: { color: palette.label } }}
              tooltip={{ enable: true }}
              className="app-chart"
            >
              <Inject services={[AreaSeries, Category, Legend, Tooltip]} />
              <SeriesCollectionDirective>
                <SeriesDirective
                  type="Area"
                  dataSource={attendanceTrend}
                  xName="week" yName="value"
                  fill={palette.series[1]}
                  name="Average attendance %"
                />
              </SeriesCollectionDirective>
            </ChartComponent>
          </div>
        </div>
      </div>

      <div id="tile-completion" className="app-tile">
        <div className="e-panel-container">
          <div className="e-panel-content">
            <h2 className="app-tile-title app-tile-drag">Completion by track</h2>
            <ChartComponent
              ref={completionChart}
              theme={theme === 'dark' ? 'Tailwind3Dark' : 'Tailwind3'}
              key={`completion-${theme}`}
              height="100%"
              primaryXAxis={{ valueType: 'Category', title: 'Track', labelStyle: { color: palette.label }, titleStyle: { color: palette.axis } }}
              primaryYAxis={{ labelFormat: '{value}%', minimum: 0, maximum: 100, labelStyle: { color: palette.label }, titleStyle: { color: palette.axis } }}
              tooltip={{ enable: true }}
              legendSettings={{ visible: true, background: palette.legendBg }}
              className="app-chart"
            >
              <Inject services={[BarSeries, Category, Legend, Tooltip, DataLabel]} />
              <SeriesCollectionDirective>
                <SeriesDirective
                  type="Bar"
                  dataSource={completionByTrack}
                  xName="track" yName="completion"
                  fill={palette.series[0]}
                  name="Average completion %"
                  dataLabel={{ visible: true }}
                />
              </SeriesCollectionDirective>
            </ChartComponent>
          </div>
        </div>
      </div>

      <div id="tile-enrollment" className="app-tile">
        <div className="e-panel-container">
          <div className="e-panel-content">
            <h2 className="app-tile-title app-tile-drag">Enrolled students per track</h2>
            <ChartComponent
              ref={enrollmentChart}
              theme={theme === 'dark' ? 'Tailwind3Dark' : 'Tailwind3'}
              key={`enrollment-${theme}`}
              height="100%"
              primaryXAxis={{ valueType: 'Category', title: 'Course', labelRotation: 0, labelStyle: { color: palette.label }, titleStyle: { color: palette.axis } }}
              primaryYAxis={{ labelFormat: '{value}', minimum: 0, labelStyle: { color: palette.label }, titleStyle: { color: palette.axis } }}
              tooltip={{ enable: true }}
              legendSettings={{ visible: true, background: palette.legendBg }}
              className="app-chart"
            >
              <Inject services={[LineSeries, Category, Legend, Tooltip]} />
              <SeriesCollectionDirective>
                {TRACKS.map((track, i) => (
                  <SeriesDirective
                    key={track}
                    type="Line"
                    name={track}
                    dataSource={store.courses.filter(c => c.track === track).map(c => ({ x: c.code, y: c.enrolled }))}
                    xName="x" yName="y"
                    fill={palette.series[i]}
                    marker={{ visible: true }}
                  />
                ))}
              </SeriesCollectionDirective>
            </ChartComponent>
          </div>
        </div>
      </div>

      <div id="tile-this-week" className="app-tile app-tile-list">
        <div className="e-panel-container">
          <div className="e-panel-content">
            <h2 className="app-tile-title app-tile-drag">
              This week
              <small>Lectures, labs, and office hours</small>
            </h2>
            <ListViewComponent
              id="week-glance"
              cssClass="week-glance"
              height="100%"
              dataSource={weekItems as unknown as { [key: string]: Object }[]}
              fields={{ id: 'id', text: 'text', groupBy: 'day' }}
              sortOrder="None"
              showHeader={false}
              template={weekTemplate}
              groupTemplate={weekGroupTemplate}
              htmlAttributes={{ 'aria-label': "This week's sessions" }}
            />
          </div>
        </div>
      </div>
    </DashboardLayoutComponent>
  );
});

export function Dashboard() {
  const { store, revision, theme } = useApp();
  const [trackFilter, setTrackFilter] = useState<Track | 'All tracks'>('All tracks');
  const [loaded, setLoaded] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null);

  // Short delay so the route skeleton is visible before the in-memory fixtures render.
  useEffect(() => {
    const t = window.setTimeout(() => setLoaded(true), 600);
    return () => window.clearTimeout(t);
  }, []);

  const aggregate = store.getAggregate();
  const courses = trackFilter === 'All tracks'
    ? store.courses
    : store.courses.filter(c => c.track === trackFilter);

  const kpis = useMemo(() => {
    const enrolled = courses.reduce((n, c) => n + c.enrolled, 0);
    const capacity = courses.reduce((n, c) => n + c.capacity, 0);
    return [
      {
        id: 'enrollment', label: 'Enrollment', icon: Users,
        value: String(enrolled), note: `${capacity ? Math.round((enrolled / capacity) * 100) : 0}% of ${capacity} seats`,
        band: enrollmentFilledBand(enrolled, capacity) as Band
      },
      {
        id: 'attendance', label: 'Average attendance', icon: CalendarCheck,
        value: `${aggregate.avgAttendance.toFixed(1)}%`, note: 'at target ≥ 85%',
        band: attendanceBand(aggregate.avgAttendance) as Band
      },
      {
        id: 'completion', label: 'Completion rate', icon: Trophy,
        value: `${aggregate.completionRate.toFixed(1)}%`, note: 'at target ≥ 80%',
        band: completionBand(aggregate.completionRate) as Band
      },
      {
        id: 'at-risk', label: 'At-risk students', icon: AlertTriangle,
        value: String(aggregate.atRiskCount), note: 'attendance < 70% or completion < 60%',
        band: (aggregate.atRiskCount > 0 ? 'watch' : 'good') as Band
      }
    ];
  }, [courses, aggregate]);

  if (!loaded) return <DashboardSkeleton />;

  return (
    <div className="page page-dashboard">
      <div className="page-toolbar">
        <div className="page-heading">
          <h1 className="page-title">Overview Dashboard</h1>
          <p className="page-description">Attendance, completion, and students who need attention this term.</p>
        </div>
        <DropDownListComponent
          dataSource={['All tracks', ...TRACKS]}
          value={trackFilter}
          change={e => setTrackFilter((e.value as Track | 'All tracks') ?? 'All tracks')}
          aria-label="Filter by track"
          placeholder="Filter by track"
        />
      </div>

      <div className="kpi-grid">
        {kpis.map(k => {
          const Icon = k.icon;
          const active = selectedKpi === k.id;
          return (
            <button
              key={k.id}
              type="button"
              className={`kpi-card${active ? ' kpi-card-active' : ''} kpi-band-${k.band}`}
              aria-pressed={active}
              onClick={() => setSelectedKpi(active ? null : k.id)}
              title={`Filter dashboard tiles to this measure — ${k.label}`}
            >
              <div className={`kpi-card-surface e-card kpi-band-${k.band}`}>
                <div className="kpi-card-content e-card-content">
                  <span className="kpi-label">{k.label}</span>
                  <span className="kpi-value">{k.value}</span>
                  <span className="kpi-note">{k.note}</span>
                  <span className={`kpi-icon kpi-icon-${k.band}`} aria-hidden="true"><Icon size={18} /></span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <DashboardTiles theme={theme} revision={revision} />
    </div>
  );
}

export default Dashboard;