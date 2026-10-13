// Domain entities and business rules
// Types below match src/data/fixtures.json.

export type Track = 'Software Engineering' | 'Data Science' | 'Cybersecurity' | 'Cloud & DevOps';
export const TRACKS: readonly Track[] = [
  'Software Engineering', 'Data Science', 'Cybersecurity', 'Cloud & DevOps'
] as const;

export type SessionType = 'lecture' | 'lab' | 'seminar' | 'office-hours';
export type StudentStatus = 'enrolled' | 'at-risk' | 'withdrawn';
export type CourseStatus = 'active' | 'planning';

export interface Course {
  id: string;
  code: string;
  title: string;
  track: Track;
  instructorId: string;
  roomId: string;
  enrolled: number;
  capacity: number;
  status: CourseStatus;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  track: Track;
  courseIds: string[];
  attendancePct: number;   // 0–100, 1 decimal
  completionPct: number;  // 0–100
  grade: 'A' | 'B' | 'C' | 'D' | 'incomplete';
  status: StudentStatus;
}

export interface SessionSlot {
  id: string;
  courseId: string;
  subject: string;
  type: SessionType;
  weekday: number;          // 0 = Sunday … 6 = Saturday
  startMinutes: number;     // minutes from midnight
  durationMinutes: number;
  roomId: string;
  instructorId: string;
  weekStartOffset: number;  // weeks from seed Monday; RRULE expanded for the term
  tags: string[];
}

export interface PlanTask {
  id: string;
  parentId: string | null;
  name: string;
  startOffsetDays: number;      // days from seed Monday
  durationDays: number;
  progress: number;             // 0–100
  predecessor?: { id: string; type: 'FS' | 'SS' };
  baselineStartOffsetDays: number;
  baselineEndOffsetDays: number;
  isMilestone: boolean;
  courseId: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  dueWeekOffset: number;
  submissions: number;
  expected: number;
  avgScore: number | null; // null → display "—"
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  status: 'draft' | 'published';
  html: string;
}

/** Publish gate for a lesson body: a heading is required, and a TODO blocks publish. */
export function lessonPublishIssue(html: string): 'heading' | 'todo' | null {
  if (!/<h[1-3]\b/i.test(html)) return 'heading';
  if (/TODO/i.test(html)) return 'todo';
  return null;
}

export interface KpiWeeklyPoint {
  weekOffset: number;  // 0–11
  enrolledByTrack: Record<Track, number>;
  attendancePct: number;
}

export interface TermFixture {
  fixtureVersion: 1;
  termName: string;
  termWeeks: number;
  courses: Course[];
  students: Student[];
  sessions: SessionSlot[];
  planTasks: PlanTask[];
  assignments: Assignment[];
  lessons: Lesson[];
  kpiSeries: KpiWeeklyPoint[];
}

// ---- Business rules: attendance, completion, and enrollment bands ----

export const BANDS = {
  attendance: { good: 85, watch: 70 },
  completion: { good: 80, watch: 60 },
  enrollmentFilled: { good: 90, watch: 70 }
} as const;

export type Band = 'good' | 'watch' | 'bad';

export function attendanceBand(pct: number): Band {
  if (pct >= BANDS.attendance.good) return 'good';
  if (pct >= BANDS.attendance.watch) return 'watch';
  return 'bad';
}

export function completionBand(pct: number): Band {
  if (pct >= BANDS.completion.good) return 'good';
  if (pct >= BANDS.completion.watch) return 'watch';
  return 'bad';
}

export function enrollmentFilledBand(enrolled: number, capacity: number): Band {
  if (capacity <= 0) return 'bad';
  const pct = (enrolled / capacity) * 100;
  if (pct >= BANDS.enrollmentFilled.good) return 'good';
  if (pct >= BANDS.enrollmentFilled.watch) return 'watch';
  return 'bad';
}

// At-risk derivation: attendance < 70 OR completion < 60.
export function derivesAtRisk(s: Student): boolean {
  return s.attendancePct < BANDS.attendance.watch || s.completionPct < BANDS.completion.watch;
}

// Room conflicts: same room, same weekday/time-window overlap within the same week.
export function findRoomConflicts(sessions: SessionSlot[]): Array<{ a: SessionSlot; b: SessionSlot; roomId: string }> {
  const out: Array<{ a: SessionSlot; b: SessionSlot; roomId: string }> = [];
  const sorted = [...sessions].sort((x, y) =>
    x.roomId !== y.roomId ? x.roomId.localeCompare(y.roomId)
      : x.weekday - y.weekday || x.startMinutes - y.startMinutes);
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i], b = sorted[j];
      if (a.roomId !== b.roomId) break;
      if (a.weekday !== b.weekday) continue;
      const aEnd = a.startMinutes + a.durationMinutes;
      const bEnd = b.startMinutes + b.durationMinutes;
      if (a.startMinutes < bEnd && b.startMinutes < aEnd) {
        out.push({ a, b, roomId: a.roomId });
      }
    }
  }
  return out;
}

// Aggregates: computed once per change, never per page.
export interface CourseAggregate {
  totalEnrolled: number;
  totalCapacity: number;
  avgAttendance: number;
  completionRate: number;
  atRiskCount: number;
}

export function computeAggregate(
  courses: Course[], students: Student[]
): CourseAggregate {
  const totalEnrolled = courses.reduce((n, c) => n + c.enrolled, 0);
  const totalCapacity = courses.reduce((n, c) => n + c.capacity, 0);
  const avgAttendance = students.length
    ? students.reduce((n, s) => n + s.attendancePct, 0) / students.length : 0;
  const completionRate = students.length
    ? students.reduce((n, s) => n + s.completionPct, 0) / students.length : 0;
  const atRiskCount = students.filter(s => derivesAtRisk(s)).length;
  return { totalEnrolled, totalCapacity, avgAttendance, completionRate, atRiskCount };
}

// Stable totals for the seeded courses, students, and sessions.
export interface ExpectedSeedValues {
  totalEnrolled: number;
  avgAttendance: number;
  atRiskCount: number;
  conflictCount: number;
}

export function expectedSeedValues(
  courses: Course[], students: Student[], sessions: SessionSlot[]
): ExpectedSeedValues {
  return {
    totalEnrolled: computeAggregate(courses, students).totalEnrolled,
    avgAttendance: Math.round(computeAggregate(courses, students).avgAttendance * 10) / 10,
    atRiskCount: students.filter(derivesAtRisk).length,
    conflictCount: findRoomConflicts(sessions).length
  };
}