// Clock: fixtures anchor to a seed Monday resolved relative to today at load.
// Keeps the term view populated at every visitor date with no runtime seeding.

export interface Clock {
  /** The seed Monday of demo term week 1 (local time). */
  seedMonday(): Date;
  /** Current demo term week (1-based). */
  termWeek(termWeeks: number): number;
}

export class SystemClock implements Clock {
  private seed: Date;

  constructor() {
    // Most recent Monday, moved back so week 1 starts 3 weeks before today — the "current" week is week 4.
    const now = new Date();
    const day = (now.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
    monday.setDate(monday.getDate() - 21);
    this.seed = monday;
  }

  seedMonday(): Date { return new Date(this.seed); }

  termWeek(termWeeks: number): number {
    const now = new Date();
    const diff = Math.floor((now.getTime() - this.seed.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return Math.min(Math.max(diff + 1, 1), termWeeks);
  }
}