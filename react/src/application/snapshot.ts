// Snapshot builder: serializes the current SessionStore into the AssistantRequest payload.
// Descriptive data only — provider suggestions never bypass validation or create writes.

import { type SessionSnapshot, type SessionStore } from './session-store';

export function buildSnapshot(
  store: SessionStore, page: string, prompt: string
): SessionSnapshot {
  const aggregate = store.getAggregate();
  const conflicts = store.getConflicts().slice(0, 5).map(({ a, roomId }) => ({
    subject: a.subject,
    roomId: roomId.replace(/^room-/, '').toUpperCase(),
    weekday: a.weekday
  }));
  const lateModules = store.planTasks
    .filter(t => t.parentId === null && t.progress < 100)
    .map(t => ({ name: t.name, progress: t.progress }))
    .slice(0, 5);
  return {
    page,
    prompt,
    fixtureVersion: 1,
    termName: 'Fall Term',
    courseCount: store.courses.filter(c => c.status === 'active').length,
    studentCount: store.students.length,
    conflicts,
    lateModules,
    atRiskCount: aggregate.atRiskCount,
    attendanceAvg: aggregate.avgAttendance
  };
}