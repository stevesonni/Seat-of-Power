/* The year as a chapter.

   Each year in office the governor can take a limited number of MAJOR
   actions: start a programme, start a project, sign an executive order,
   sponsor a bill, adopt a revenue reform, create or restructure a ministry,
   open an investigation. Meetings, inspections, reading reports and
   answering the year's events never use it, and never end the year.

   Balance: eight big moves a year on Medium (ten on Easy, six on Hard),
   more for a strong cabinet and a trusting public. Bills and executive
   orders do not count: bills are limited by the House, orders by the
   charge of ruling by decree.
   A typical year brings two to four needs plus the flagship, so a governor
   can answer what matters but cannot do everything at once. The limit
   resets when the year ends. */
export const AGENDA_SIZE = { easy: 10, medium: 8, hard: 6 };
/* Big moves earned on top: a capable Chief of Staff (+1), each commissioner
   or minister performing well (+1, up to 3: they carry work for you), and a
   public that trusts you (approval 60+: +1). */
export const agendaBonus = ({ cosComp = 0, perfs = [], app = 50 } = {}) => {
  const parts = [];
  if (cosComp >= 70) parts.push({ l: "A capable Chief of Staff", n: 1 });
  const good = Math.min(3, perfs.filter(p => (p == null ? 50 : p) >= 70).length);
  if (good) parts.push({ l: good + " strong " + (good === 1 ? "member" : "members") + " of your cabinet", n: good });
  if (app >= 60) parts.push({ l: "Approval above 60", n: 1 });
  return { n: parts.reduce((a, x) => a + x.n, 0), parts };
};
export const agendaSize = (level, bonus = 0) => (AGENDA_SIZE[level] || AGENDA_SIZE.medium) + (bonus || 0);
// Bills and executive orders do not use the big moves: the House sits for only so many bills a year,
// and every order adds to the charge of ruling by decree.
export const BILLS_A_YEAR = 3;
export const FREE_KINDS = ["bill", "order"];

const cur = (ag, turn) => (ag && ag.turn === turn ? { free: [], ...ag } : { turn, used: [], free: [] });
export const agendaUsed = (ag, turn) => cur(ag, turn).used.length;
export const agendaLeft = (ag, turn, level, bonus = 0) => Math.max(0, agendaSize(level, bonus) - agendaUsed(ag, turn));
export const billsLeft = (ag, turn) => Math.max(0, BILLS_A_YEAR - cur(ag, turn).free.filter(u => u.kind === "bill").length);
export const ordersThisYear = (ag, turn) => cur(ag, turn).free.filter(u => u.kind === "order").length;

// Spend one. The same key twice in one year costs once (a bill that goes
// back to the House, a form submitted twice). Returns why when it cannot.
export const spendAgenda = (ag, turn, level, { kind, label, key }, bonus = 0) => {
  const c = cur(ag, turn), k = key || (kind + ":" + label);
  if (c.used.some(u => u.key === k) || c.free.some(u => u.key === k)) return { ok: true, agenda: c, repeat: true };
  if (FREE_KINDS.includes(kind)) {
    if (kind === "bill" && billsLeft(c, turn) <= 0) return { ok: false, agenda: c, why: "bills" };
    const free = [...c.free, { kind, label, key: k }];
    return { ok: true, agenda: { ...c, free }, free: true, orders: free.filter(u => u.kind === "order").length };
  }
  if (c.used.length >= agendaSize(level, bonus)) return { ok: false, agenda: c, why: "full" };
  return { ok: true, agenda: { ...c, used: [...c.used, { kind, label, key: k }] } };
};

/* Once-only resolution. A year's end (income, spending, progress, crises)
   runs once per year: a second click, a refresh or a reload of a save made
   after it ran does nothing. `done` is the last year already resolved. */
export const canResolveYear = (done, turn) => (Number(done) || 0) < turn;
