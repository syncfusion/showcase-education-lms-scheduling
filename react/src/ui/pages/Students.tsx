// Students page: DataGrid roster with dropdown editors.
import { useEffect, useRef, useState } from 'react';
import {
  GridComponent, ColumnsDirective, ColumnDirective,
  Page, Sort, Filter, Edit, Inject
} from '@syncfusion/ej2-react-grids';
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import { DropDownList } from '@syncfusion/ej2-dropdowns';
import { ProgressBar } from '@syncfusion/ej2-progressbar';
import { Tooltip } from '@syncfusion/ej2-popups';
import { useApp } from '../../application/app-context';
import { StudentsSkeleton } from '../route-skeletons';
import { TRACKS, attendanceBand, completionBand, derivesAtRisk } from '../../domain/entities';

const STATUS = ['enrolled', 'at-risk', 'withdrawn'] as const;

// Title-case: "at-risk" → "At-Risk", "enrolled" → "Enrolled"
function titleCase(value: string): string {
  return value.split(/([-\s])/).map(p => p ? p.charAt(0).toUpperCase() + p.slice(1) : p).join('').replace(/([-\s])([a-z])/g, (_m, s: string, c: string) => s + c.toUpperCase());
}

const STATUS_OPTIONS = STATUS.map(titleCase); // Enrolled / At-Risk / Withdrawn
const ALL_OPTION = 'All';

export function Students() {
  const { store, theme } = useApp();
  const [loaded, setLoaded] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_OPTION);
  void theme; // tones resolve through statusTones(theme) below
  useEffect(() => {
    const t = window.setTimeout(() => setLoaded(true), 600);
    return () => window.clearTimeout(t);
  }, []);

  const deriveStatus = (s: typeof store.students[number]): 'enrolled' | 'at-risk' | 'withdrawn' =>
    s.status === 'withdrawn' ? 'withdrawn'
      : derivesAtRisk(s) ? 'at-risk'
        : 'enrolled';

  const tones = statusTones(theme);
  const rows = store.students
    .filter(s => statusFilter === ALL_OPTION || deriveStatus(s).toUpperCase() === statusFilter.toUpperCase())
    .map(s => {
      const att = Math.min(100, Math.max(0, s.attendancePct));
      const com = Math.min(100, Math.max(0, s.completionPct));
      const attBand = attendanceBand(s.attendancePct);
      const comBand = completionBand(s.completionPct);
      return {
        ...s,
        status: deriveStatus(s),
        attendanceBand: attBand,
        completionBandLabel: comBand,
        statusCap: titleCase(deriveStatus(s)),
        attendanceBarWidth: `${att}%`,
        attendanceValueLabel: `${s.attendancePct.toFixed(1)}%`,
        completionBarWidth: `${com}%`,
        completionValueLabel: `${Math.round(s.completionPct)}%`,
        attPct: att,
        comPct: com,
        attendanceTone: tones[attBand] ?? tones.neutral,
        completionTone: tones[comBand] ?? tones.neutral
      };
    });

  if (!loaded) return <StudentsSkeleton />;

  return (
    <div className="page page-students">
      <div className="page-toolbar">
        <div className="page-heading">
          <h1 className="page-title">Student Roster</h1>
          <p className="page-description">Enrollment, attendance, and completion for every student in the term.</p>
        </div>
        <DropDownListComponent
          dataSource={[ALL_OPTION, ...STATUS_OPTIONS]}
          value={statusFilter}
          change={e => setStatusFilter(String(e.value ?? ALL_OPTION))}
          aria-label="Filter by status"
          placeholder="Filter by status"
        />
      </div>
      <GridComponent
        id="students-roster"
        dataSource={rows}
        allowPaging
        allowSorting
        allowFiltering
        pageSettings={{ pageSize: 8 }}
        editSettings={{ allowEditing: true, allowAdding: true, mode: 'Dialog' }}
        className="app-grid"
      >
        <Inject services={[Page, Sort, Filter, Edit]} />
        <ColumnsDirective>
          <ColumnDirective field="id" headerText="ID" width="120" visible={false} isPrimaryKey={true} />
          <ColumnDirective field="name" headerText="Name" width="160" />
          <ColumnDirective field="track" headerText="Track" width="150" clipMode="EllipsisWithTooltip"
            edit={{ create: trackEditCreate, write: trackEditWrite, read: trackEditRead, destroy: trackEditDestroy }} />
          <ColumnDirective field="email" headerText="Email" width="200" clipMode="EllipsisWithTooltip" />
          <ColumnDirective field="attendancePct" headerText="Attendance %" width="170" allowSorting={false} allowFiltering={false}
            template={(data: never) => <ProgressCell row={data as GridRow} completion={false} />} />
          <ColumnDirective field="completionPct" headerText="Completion %" width="170" allowSorting={false} allowFiltering={false}
            template={(data: never) => <ProgressCell row={data as GridRow} completion={true} />} />
          <ColumnDirective field="status" headerText="Status" width="150"
            template={'<span class="grid-chip grid-chip-${status}">${statusCap}</span>'} />
        </ColumnsDirective>
      </GridComponent>
      <p className="app-footnote">Good ≥ 85 / 70–84 watch / &lt; 70 at risk for attendance; ≥ 80 / 60–79 / &lt; 60 for completion. Grid edits stay in this tab.</p>
    </div>
  );
}

interface GridRow {
  id: string;
  status: string;
  statusCap: string;
  attendancePct: number;
  completionPct: number;
  attPct: number;
  comPct: number;
  attendanceBand: string;
  completionBandLabel: string;
  attendanceTone: string;
  completionTone: string;
}

// Band → themed tone (same status tones as charts and KPI icons). Resolved per theme
// exactly like adapters/palette.ts so cells follow the active light/dark tokens.
function statusTones(theme: 'light' | 'dark'): Record<string, string> {
  return theme === 'dark'
    ? { good: '#86efac', watch: '#fbbf24', bad: '#fca5a5', neutral: '#94a3b8', reference: '#94a3b8' }
    : { good: '#027a48', watch: '#b54708', bad: '#b42318', neutral: '#667085', reference: '#667085' };
}

// Syncfusion progress bar in a Grid cell.
function ProgressCell(props: { row: GridRow; completion: boolean }) {
  const { row, completion } = props;
  const hostRef = useRef<HTMLSpanElement | null>(null);
  const band = completion ? row.completionBandLabel : row.attendanceBand;
  const tone = completion ? row.completionTone : row.attendanceTone;
  const value = completion ? row.comPct : row.attPct;
  const label = completion
    ? `${Math.round(row.completionPct)}%`
    : `${row.attendancePct.toFixed(1)}%`;
  const tooltipContent = completion
    ? `Completion: ${Math.round(row.completionPct)}% (${band})`
    : `Attendance: ${row.attendancePct.toFixed(1)}% (${band})`;

  // The ProgressBar resolves its SVG id as `element.id + 'SVG'`; 
  const barId = `grid-progressbar-${completion ? 'com' : 'att'}-${row.id}`;
  useEffect(() => {
    const host = hostRef.current;
    if (!host) { return; }
    const bar = new ProgressBar({
      type: 'Linear',
      value,
      minimum: 0,
      maximum: 100,
      trackThickness: 6,
      progressThickness: 6,
      progressColor: tone,
      cornerRadius: 4 as never,
      showProgressValue: false,
      theme: 'Tailwind3',
      animation: { enable: false }
    });
    const el = document.createElement('div');
    el.className = 'grid-progressbar';
    el.id = barId;
    host.appendChild(el);
    bar.appendTo(el);
    // Plain Tooltip widget It targets the whole cell wrapper and shows the value on hover.
    const cellWrapper = host.querySelector<HTMLElement>('.grid-badge-progress') ?? host;
    const tooltip = new Tooltip({
      content: tooltipContent,
      position: 'BottomCenter',
      windowCollision: true,
      showTipPointer: true,
      cssClass: 'grid-progress-tooltip',
      opensOn: 'Hover'
    });
    tooltip.appendTo(cellWrapper);
    return () => {
      tooltip.destroy();
      bar.destroy();
      el.remove();
    };
  }, [barId, value, tone, tooltipContent]);

  return (
    <div className={`grid-badge-progress grid-band-${band}`} role="img" aria-label={tooltipContent}>
      <span ref={hostRef} />
      <span className="grid-progress-value">{label}</span>
    </div>
  );
}

// Dialog-edit callbacks for the Track column.

let trackEditInstance: DropDownList | null = null;

interface TrackEditWriteArgs {
  rowData: { track?: string };
  element: HTMLElement;
}

function trackEditCreate(): HTMLInputElement {
  return document.createElement('input');
}

function trackEditWrite(args: TrackEditWriteArgs): void {
  trackEditInstance = new DropDownList({
    dataSource: [...TRACKS],
    value: args.rowData.track ?? null,
    placeholder: 'Track',
    popupHeight: '200px',
    floatLabelType: 'Always',
    htmlAttributes: { 'aria-label': 'Track' }
  });
  trackEditInstance.appendTo(args.element);
}

function trackEditRead(): string {
  return trackEditInstance?.value as string ?? '';
}

function trackEditDestroy(): void {
  if (trackEditInstance && !trackEditInstance.isDestroyed) {
    trackEditInstance.destroy();
  }
  trackEditInstance = null;
}

export default Students;