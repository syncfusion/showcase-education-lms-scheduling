// Mock assistant provider.
// Responses are built from the live session snapshot and labelled simulated.
// Never streams, never writes, holds no credentials; replaceable via AssistantProvider IoC.

import { type AssistantProvider, type AssistantRequest, type AssistantResponse, type SessionSnapshot } from './session-store';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
let sequence = 0;
const timers = new Map<string, number>();

function simulatedFooter(): string {
  return '\n\n---\n*AI (simulated) — generated from your current demo session.*';
}

function buildResponseText(page: string, prompt: string, snap: SessionSnapshot): string {
  const lower = prompt.toLowerCase();
  const conflictLines = snap.conflicts
    .map(c => `**${c.subject}** — Room ${c.roomId}, ${WEEKDAYS[c.weekday]}`)
    .join('\n');

  if (page === 'dashboard') {
    if (lower.includes('enroll')) {
      return `Enrollment stands at **${snap.courseCount} active courses** across ${snap.termName}.` + simulatedFooter();
    }
    if (lower.includes('attendance')) {
      return `Average attendance is **${snap.attendanceAvg.toFixed(1)}%**.` +
        `\n\nBands: at target ≥ 85% · watch 70–84% · at risk below 70%. Current average band: **${snap.attendanceAvg >= 85 ? 'at target' : snap.attendanceAvg >= 70 ? 'watch' : 'at risk'}**.` + simulatedFooter();
    }
    if (lower.includes('completion') || lower.includes('track')) {
      return `**${snap.atRiskCount} students** are flagged at risk (attendance under 70% or completion under 60%).` + simulatedFooter();
    }
  }

  if (page === 'schedule') {
    if (lower.includes('conflict') || lower.includes('room')) {
      return snap.conflicts.length
        ? `**${snap.conflicts.length} room conflict${snap.conflicts.length > 1 ? 's' : ''} this week:**\n\n${conflictLines}\n\nDrag one session to another room on the timetable, or open **Edit session** to reassign it.` + simulatedFooter()
        : `No room conflicts this week — every scheduled session has its own room and time.` + simulatedFooter();
    }
  }

  if (page === 'plan') {
    if (lower.includes('late') || lower.includes('behind') || lower.includes('module')) {
      return snap.lateModules.length
        ? `Modules running behind baseline:\n\n${snap.lateModules.map(m => `**${m.name}** — ${m.progress}% complete`).join('\n')}\n\nDrag a module bar or use **Reschedule** to move it, and watch its dependency lines follow.` + simulatedFooter()
        : `Every module is at or ahead of its baseline this term.` + simulatedFooter();
    }
  }

  if (page === 'students') {
    if (lower.includes('risk') || lower.includes('student')) {
      return `**${snap.atRiskCount} of ${snap.studentCount}** students are at risk (attendance < 70% or completion < 60%). Filter the roster by status, or open a row to record an intervention.` + simulatedFooter();
    }
  }

  // Fallback template: unmatched prompts list examples instead of failing silently.
  return `I can answer questions about this page from your current demo session, for example:\n\n${
    page === 'schedule' ? '- Which sessions conflict this week?\n- Where is CS-101 on Tuesday?'
      : page === 'plan' ? '- Which modules are running late vs baseline?\n- When does the Assessment milestone land?'
      : page === 'students' ? '- How many students are at risk?\n- Show completion by track.'
      : '- Summarize completion by track.\n- How is attendance trending?'
  }${simulatedFooter()}`;
}

export class MockAssistantProvider implements AssistantProvider {
  async respond(request: AssistantRequest): Promise<AssistantResponse> {
    const id = `assistant-${request.id}-${++sequence}`;
    return new Promise<AssistantResponse>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        timers.delete(id);
        resolve({
          id,
          text: buildResponseText(request.page, request.prompt, request.snapshot),
          completedAt: Date.now()
        });
      }, 800);
      timers.set(id, timer);
      this.pending.set(id, { resolve, reject });
    });
  }

  private pending = new Map<string, { resolve: (r: AssistantResponse) => void; reject: (e: Error) => void }>();

  cancel(id: string): void {
    const timer = timers.get(id);
    if (timer !== undefined) { window.clearTimeout(timer); timers.delete(id); }
    const entry = this.pending.get(id);
    if (entry) { entry.reject(new Error('cancelled')); this.pending.delete(id); }
  }
}