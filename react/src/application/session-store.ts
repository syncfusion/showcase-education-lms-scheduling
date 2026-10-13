// SessionStore + AssistantProvider + Clock — application layer.
// One in-memory session model shared by every page.
// Commands mutate only the cloned store; reset re-clones from fixtures; nothing persists.

import {
  type TermFixture, type Course, type SessionSlot, type Student, type PlanTask,
  type Lesson, type Assignment, computeAggregate, findRoomConflicts
} from '../domain/entities';
import { flattenMaterials, readFixtureFiles, type MaterialFile } from '../adapters/materials';
import { SystemClock } from './clock';

export interface SessionSnapshot {
  page: string;
  prompt: string;
  fixtureVersion: number;
  termName: string;
  courseCount: number;
  studentCount: number;
  conflicts: Array<{ subject: string; roomId: string; weekday: number }>;
  lateModules: Array<{ name: string; progress: number }>;
  atRiskCount: number;
  attendanceAvg: number;
}

export interface AssistantRequest {
  id: string;
  page: string;
  prompt: string;
  snapshot: SessionSnapshot;
  createdAt: number;
}

export interface AssistantResponse {
  id: string;
  text: string;
  suggestions?: string[];
  completedAt: number;
}

/** AI provider abstraction (IoC): a mock implementation is selected at startup; never a type check. */
export interface AssistantProvider {
  respond(request: AssistantRequest): Promise<AssistantResponse>;
  cancel(id: string): void;
}

export class SessionStore {
  private fixture: TermFixture;
  private state: TermFixture;
  private listeners = new Set<() => void>();
  private sessionCommands = 0;
  private seed: Date;
  /** Stable array the File Manager mutates in place. Replaced only on reset. */
  private files: MaterialFile[];
  private materialsGeneration = 0;

  constructor(fixture: TermFixture) {
    this.fixture = fixture;
    this.state = structuredClone(fixture);
    this.seed = new SystemClock().seedMonday();
    this.files = this.filesFrom(fixture);
  }

  private filesFrom(fixture: object): MaterialFile[] {
    const tree = readFixtureFiles(fixture);
    return tree ? flattenMaterials(tree, this.seed) : [];
  }

  private emit(): void { this.listeners.forEach(l => l()); }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  get courses(): Course[] { return this.state.courses; }
  get students(): Student[] { return this.state.students; }
  get sessions(): SessionSlot[] { return this.state.sessions; }
  get planTasks(): PlanTask[] { return this.state.planTasks; }
  get lessons(): Lesson[] { return this.state.lessons; }
  get assignments(): Assignment[] { return this.state.assignments; }
  get changes(): number { return this.sessionCommands; }
  /** Flat materials library. Keep this reference: the File Manager writes into it. */
  get fileSystemData(): MaterialFile[] { return this.files; }
  /** Bumps when reset replaces the materials array so the File Manager remounts. */
  get materialsEpoch(): number { return this.materialsGeneration; }
  get instructors(): Array<{ id: string; name: string; role: string }> {
    return ((this.state as TermFixture & { instructors?: Array<{ id: string; name: string; role: string }> }).instructors) ?? [];
  }
  get rooms(): Array<{ id: string; name: string }> {
    return ((this.state as TermFixture & { rooms?: Array<{ id: string; name: string }> }).rooms) ?? [];
  }

  getAggregate() { return computeAggregate(this.state.courses, this.state.students); }
  getConflicts() { return findRoomConflicts(this.state.sessions); }

  addSession(slot: Omit<SessionSlot, 'id'>): string {
    this.sessionCommands++;
    const id = `session-new-${this.sessionCommands}`;
    this.state.sessions = [...this.state.sessions, { ...slot, id }];
    this.emit();
    return id;
  }

  updateSession(id: string, patch: Partial<SessionSlot>): void {
    this.state.sessions = this.state.sessions.map(s => (s.id === id ? { ...s, ...patch } : s));
    this.sessionCommands++;
    this.emit();
  }

  removeSession(id: string): void {
    this.state.sessions = this.state.sessions.filter(s => s.id !== id);
    this.sessionCommands++;
    this.emit();
  }

  addStudent(student: Omit<Student, 'id'>): string {
    this.sessionCommands++;
    const id = `student-new-${this.sessionCommands}`;
    this.state.students = [...this.state.students, { ...student, id }];
    this.emit();
    return id;
  }

  updateStudent(id: string, patch: Partial<Student>): void {
    this.state.students = this.state.students.map(s => (s.id === id ? { ...s, ...patch } : s));
    this.sessionCommands++;
    this.emit();
  }

  updateLesson(id: string, html: string): void {
    this.state.lessons = this.state.lessons.map(l => (l.id === id ? { ...l, html } : l));
    this.sessionCommands++;
    this.emit();
  }

  setLessonStatus(id: string, status: Lesson['status']): void {
    this.state.lessons = this.state.lessons.map(l => (l.id === id ? { ...l, status } : l));
    this.sessionCommands++;
    this.emit();
  }

  /**
   * Session-only upload. Rejects a name that already exists anywhere in the tree
   * (the flat-data control treats names as globally unique). Does not replace the array.
   */
  addMaterial(parentId: string, name: string, size: number, filterPath: string, type: string): boolean {
    if (this.files.some(file => file.name === name)) return false;
    const now = new Date();
    this.sessionCommands++;
    this.files.push({
      id: `file-session-${this.sessionCommands}`,
      name,
      parentId,
      isFile: true,
      size,
      type,
      dateCreated: now,
      dateModified: now,
      filterPath,
      hasChild: false,
    });
    const parent = this.files.find(file => file.id === parentId);
    if (parent && !parent.isFile) parent.hasChild = true;
    this.emit();
    return true;
  }

  /** Tell listeners the File Manager mutated the materials array in place. */
  noteMaterialsChanged(): void {
    this.sessionCommands++;
    this.emit();
  }

  updatePlanTask(id: string, patch: Partial<PlanTask>): void {
    this.state.planTasks = this.state.planTasks.map(t => (t.id === id ? { ...t, ...patch } : t));
    this.sessionCommands++;
    this.emit();
  }

  /** Reset demo data: synchronous re-clone from committed fixtures (calls only, no network). */
  reset(): void {
    this.state = structuredClone(this.fixture);
    this.files = this.filesFrom(this.fixture);
    this.materialsGeneration++;
    this.sessionCommands = 0;
    this.emit();
  }
}