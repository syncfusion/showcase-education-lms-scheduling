// Schedule page: Scheduler timetable with instructor and room resources and weekly recurrence.
import { useEffect, useState } from 'react';
import {
  ScheduleComponent, Day, Week, WorkWeek, Month, Agenda, TimelineViews, Resize, DragAndDrop, Inject,
  ResourcesDirective, ResourceDirective
} from '@syncfusion/ej2-react-schedule';
import { useApp } from '../../application/app-context';
import { ScheduleSkeleton } from '../route-skeletons';

const TERM_WEEKS = 12; // matches fixture termWeeks
const SEED_MONDAY = new Date(2026, 8, 7); // seed Monday used by the plan baseline
const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const;
// Same cutoff as the shell: drawer nav below 1024px (mobile and tablet).
const NARROW_SCHEDULE = '(max-width: 1023.98px)';

function useNarrowSchedule(): boolean {
  const [narrow, setNarrow] = useState(() => window.matchMedia(NARROW_SCHEDULE).matches);
  useEffect(() => {
    const query = window.matchMedia(NARROW_SCHEDULE);
    const apply = () => setNarrow(query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);
  return narrow;
}

// Resource colors (resource colorization) — per instructor, matching the chart palette.
const INSTRUCTOR_COLORS = ['#3b82f6', '#0d9488', '#a21caf', '#0369a1'];

function dateAt(dayOffsetFromSeed: number, minutes: number): Date {
  const d = new Date(SEED_MONDAY.getTime() + dayOffsetFromSeed * 86400000);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
}

export function Schedule() {
  const { store } = useApp();
  const narrow = useNarrowSchedule();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setLoaded(true), 600);
    return () => window.clearTimeout(t);
  }, []);

  // Lecture and lab slots repeat weekly across the 12-week term via RRULE.
  const events = store.sessions.map(s => {
    const course = store.courses.find(c => c.id === s.courseId);
    const recurring = s.type === 'lecture' || s.type === 'lab';
    const start = dateAt((s.weekday + 6) % 7, s.startMinutes); // weekday 0=Sun → Monday-based grid
    const end = dateAt((s.weekday + 6) % 7, s.startMinutes + s.durationMinutes);
    return {
      Id: s.id,
      Subject: `${course?.code ?? ''} ${s.type === 'lecture' ? 'lecture' : s.type === 'lab' ? 'lab' : s.type === 'seminar' ? 'seminar' : 'office hours'}`.trim(),
      RoomId: `${s.instructorId}|${s.roomId}`, // matches the grouped room resource key
      InstructorId: s.instructorId,
      // Recurrence (RRULE): weekly through the 12-week term — Scheduler renders occurrences without fixture duplication.
      StartTime: start,
      EndTime: end,
      RecurrenceRule: recurring
        ? `FREQ=WEEKLY;INTERVAL=1;BYDAY=${BYDAY[s.weekday]};COUNT=${TERM_WEEKS - (s.weekStartOffset || 0)}`
        : undefined
                           };
  });

  // Instructor and room resources. Rooms hang under the
  // instructor who teaches in them — parent-child grouping avoids a cross-product grid.
  const instructorResources = store.instructors.map((i, idx) => ({
    text: i.name,
    id: i.id,
    role: i.role,
    color: INSTRUCTOR_COLORS[idx % INSTRUCTOR_COLORS.length]
  }));
  const roomPairKeys = new Set(store.sessions.map(s => `${s.instructorId}|${s.roomId}`));
  const roomResources = [...roomPairKeys].map(key => {
    const [instId, roomId] = key.split('|');
    return {
      text: roomId.replace('room-', '').toUpperCase(),
      id: key,
      groupID: instId
    };
  });

  if (!loaded) return <ScheduleSkeleton />;

  return (
    <div className="page page-schedule">
      <div className="page-toolbar">
        <div className="page-heading">
          <h1 className="page-title">Class Schedule</h1>
          <p className="page-description">This week's lectures and labs, grouped by instructor and room.</p>
        </div>
      </div>
      <ScheduleComponent
        currentView="Week"
        selectedDate={new Date(2026, 8, 7)}
        showWeekend={false}
        startHour="08:00"
        endHour="19:00"
        workDays={[1, 2, 3, 4, 5]}
        workHours={{ start: '08:00', end: '18:00' }}
        timeScale={{ enable: true, interval: 60, slotCount: 2 }}
        eventSettings={{ dataSource: events }}
        enableAdaptiveUI={narrow}
        group={{ resources: ['Instructors', 'Rooms'], enableCompactView: true }}
        width="100%"
        className="app-schedule"
      >
        <ResourcesDirective>
          <ResourceDirective
            field="InstructorId" title="Instructor" name="Instructors"
            dataSource={instructorResources}
            idField="id" textField="text" colorField="color"
            allowMultiple={false}
          />
          <ResourceDirective
            field="RoomId" title="Room" name="Rooms"
            dataSource={roomResources}
            idField="id" textField="text" groupIDField="groupID"
            allowMultiple={false}
          />
        </ResourcesDirective>
        <Inject services={[Day, Week, WorkWeek, Month, Agenda, TimelineViews, Resize, DragAndDrop]} />
      </ScheduleComponent>
      <p className="app-footnote">Lectures and labs repeat weekly for the 12-week term (RRULE); drag a session to another room or instructor lane to resolve the seeded B-104 conflict.</p>
    </div>
  );
}

export default Schedule;