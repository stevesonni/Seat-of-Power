/* The year as a chapter.

   Each year in office the governor can take a limited number of MAJOR
   actions: start a programme, start a project, sign an executive order,
   sponsor a bill, adopt a revenue reform, create or restructure a ministry,
   open an investigation. Meetings, inspections, reading reports and
   answering the year's events never use it, and never end the year.

   Balance assumption: six a year on Medium (seven on Easy, five on Hard).
   A typical year brings two to four needs plus the flagship, so a governor
   can answer what matters but cannot do everything at once. The limit
   resets when the year ends. */
export const AGENDA_SIZE = { easy: 7, medium: 6, hard: 5 };
export const agendaSize = (level) => AGENDA_SIZE[level] || AGENDA_SIZE.medium;

const cur = (ag, turn) => (ag && ag.turn === turn ? ag : { turn, used: [] });
export const agendaUsed = (ag, turn) => cur(ag, turn).used.length;
export const agendaLeft = (ag, turn, level) => Math.max(0, agendaSize(level) - agendaUsed(ag, turn));

// Spend one slot. The same key twice in one year costs once (a bill that
// goes back to the House, a form submitted twice).
export const spendAgenda = (ag, turn, level, { kind, label, key }) => {
  const c = cur(ag, turn), k = key || (kind + ":" + label);
  if (c.used.some(u => u.key === k)) return { ok: true, agenda: c, repeat: true };
  if (c.used.length >= agendaSize(level)) return { ok: false, agenda: c };
  return { ok: true, agenda: { turn, used: [...c.used, { kind, label, key: k }] } };
};

/* Once-only resolution. A year's end (income, spending, progress, crises)
   runs once per year: a second click, a refresh or a reload of a save made
   after it ran does nothing. `done` is the last year already resolved. */
export const canResolveYear = (done, turn) => (Number(done) || 0) < turn;
