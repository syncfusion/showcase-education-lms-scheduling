// Plan page: Gantt term course plan with baseline, critical path, labels, and markers.
import { useEffect, useState } from 'react';
import {
  GanttComponent, Inject, Edit, Selection, Toolbar,
  DayMarkers as DayMarker, CriticalPath, Filter, Sort, ContextMenu
} from '@syncfusion/ej2-react-gantt';
import { useApp } from '../../application/app-context';
import { PlanSkeleton } from '../route-skeletons';

export function Plan() {
  const { store } = useApp();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setLoaded(true), 600);
    return () => window.clearTimeout(t);
  }, []);

  const seed = new Date(2026, 8, 7); // seed Monday
  const fmtDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Taskbar templates bind by field name (taskFields.progress), not by a JS expression.
  // '${Progress}%' reads the mapped field.
  // Module names shown on bars and in the Name column.
  // Timeline units are wide enough that the bottom-tier day labels are not clipped.
  const titleCaseName = (value: string): string =>
    value
      .replace(/(^|\s|—|-)([a-z])/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase())
      .replace(/^(\w)/, m => m.toUpperCase());

  const tasks = store.planTasks.map(t => {
    const course = store.courses.find(c => c.id === t.courseId);
    return {
      ID: t.id,
      // Title-cased display id for the grid ID column ("task-w1-found" → "Task W1 Found");
      // the raw id stays the dependency/milestone key.
      IdDisplay: titleCaseName(t.id.replace(/^task-/, '').replace(/-/g, ' ')),
      Name: titleCaseName(t.name),
      Course: course ? `${course.code} — ${course.title}` : '',
      Track: course?.track ?? '',
      StartDate: new Date(seed.getTime() + t.startOffsetDays * 86400000),
      EndDate: new Date(seed.getTime() + (t.startOffsetDays + t.durationDays) * 86400000),
      Progress: t.progress,
      Parens: t.parentId,
      milestone: t.isMilestone ? 'milestone' : '',
      Predecessor: t.predecessor ? `${t.predecessor.id} ${t.predecessor.type}` : undefined,
      baselineStartDate: new Date(seed.getTime() + t.baselineStartOffsetDays * 86400000),
      baselineEndDate: new Date(seed.getTime() + t.baselineEndOffsetDays * 86400000)
    };
  });

  // Chart-area labels: course on the left, progress % inside the bar (field-name template).
  const labelSettings = {
    leftLabel: 'Course',
    taskLabel: '${Progress}%'
  };

  const timelineSettings = {
    timelineUnitSize: 28,                                  // wide enough for bottom-tier day labels
    // Top tier = weeks, bottom tier = days (matching the fixture 12-week/7-day grid).
    topTier: { unit: 'Week' as const, format: 'MMM d' },
    bottomTier: { unit: 'Day' as const, format: 'd' }
  };

  if (!loaded) return <PlanSkeleton />;

  return (
    <div className="page page-plan">
      <div className="page-toolbar">
        <div className="page-heading">
          <h1 className="page-title">Term Course Plan</h1>
          <p className="page-description">Module progress for the 12-week term, compared with the original plan.</p>
        </div>
      </div>
      <GanttComponent
        dataSource={tasks}
        height="560px"
        taskFields={{
          id: 'ID', name: 'Name', startDate: 'StartDate', endDate: 'EndDate',
          progress: 'Progress', parentID: 'Parens', baselineStartDate: 'baselineStartDate',
          baselineEndDate: 'baselineEndDate', milestone: 'milestone'
        }}
        timelineSettings={timelineSettings}
        labelSettings={labelSettings}
        renderBaseline={true}
        // Project window must span the full 12-week term (plus padding) — the chart's
        // scrollable range is computed from these dates
        projectStartDate={new Date(seed.getTime() - 2 * 86400000)}
        projectEndDate={new Date(seed.getTime() + (12 * 7 + 7) * 86400000)}
        splitterSettings={{ position: '34%' }}
        columns={[
          { field: 'IdDisplay', headerText: 'Task ID', width: 130, clipMode: 'EllipsisWithTooltip', allowSorting: true },
          { field: 'Name', headerText: 'Module', width: 210, clipMode: 'EllipsisWithTooltip' },
          { field: 'Course', headerText: 'Course (code — title)', width: 240, clipMode: 'EllipsisWithTooltip', allowSorting: true },
          { field: 'Progress', headerText: 'Progress (%)', width: 110, textAlign: 'Right' }
        ]}
        allowSorting
        allowFiltering
        enableCriticalPath
        highlightWeekends
        eventMarkers={[ // milestone anchor from the plan
          { day: fmtDate(new Date(seed.getTime() + 42 * 86400000)), label: 'Project Milestone' }
        ]}
        tooltipSettings={{ showTooltip: true }}
        toolbar={['ZoomIn', 'ZoomOut', 'ZoomToFit', 'CollapseAll', 'ExpandAll']}
        className="app-gantt"
      >
        <Inject services={[Edit, Selection, Toolbar, DayMarker, CriticalPath, Filter, Sort, ContextMenu]} />
      </GanttComponent>
      <p className="app-footnote">Left labels show the course; task bars show progress; right labels show the module. The dashed baseline under each bar is the original plan, and the marker flags the Week-6 project milestone dashed line.</p>
    </div>
  );
}

export default Plan;