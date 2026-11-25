// src/lib/analytics.js
// Upiti za analitiku kalendara (admin pregled i CSV export). Datumi su po
// beogradskom vremenu; "createdAt" se čuva u UTC (Prisma).
import prisma from "@/lib/db";

const LOCAL_DATE = `(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Belgrade')::date`;

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

function today() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Belgrade" });
}

// ?from=YYYY-MM-DD&to=YYYY-MM-DD — KADA se desilo (podrazumevano od početka tekućeg meseca do danas)
// ?cal=YYYY-MM — KOJI kalendar (mesec kalendara); bez njega svi kalendari
export function parseRange(searchParams) {
  const t = today();
  let from = searchParams.get("from");
  let to = searchParams.get("to");
  if (!ISO_RE.test(from || "")) from = `${t.slice(0, 7)}-01`;
  if (!ISO_RE.test(to || "")) to = t;
  if (from > to) [from, to] = [to, from];
  const m = /^(\d{4})-(\d{2})$/.exec(searchParams.get("cal") || "");
  const cal = m && +m[2] >= 1 && +m[2] <= 12 ? { year: +m[1], month: +m[2] - 1 } : null;
  return { from, to, cal };
}

// WHERE za period (+ izabrani kalendar) i parametri upita
function filter({ from, to, cal }) {
  const where = `${LOCAL_DATE} BETWEEN $1::date AND $2::date` + (cal ? ` AND year = $3::int AND month = $4::int` : "");
  return { where, params: cal ? [from, to, cal.year, cal.month] : [from, to] };
}

// Postgres COUNT vraća BigInt — u običan broj, da prođe kroz JSON
function num(rows) {
  return rows.map((r) =>
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "bigint" ? Number(v) : v]))
  );
}

const COUNTS = `
  COUNT(*) FILTER (WHERE type = 'view')     AS views,
  COUNT(DISTINCT visitor) FILTER (WHERE type = 'view') AS visitors,
  COUNT(*) FILTER (WHERE type = 'day_open') AS opens,
  COUNT(*) FILTER (WHERE type IN ('scratch', 'slot'))  AS scratches,
  COUNT(*) FILTER (WHERE type = 'cta')      AS ctas`;

export async function getAnalytics({ from, to, cal }) {
  const { where, params } = filter({ from, to, cal });

  const [totals, byDate, byPromo, byDevice, calendars] = await Promise.all([
    prisma.$queryRawUnsafe(`SELECT ${COUNTS} FROM "CalendarEvent" WHERE ${where}`, ...params),
    prisma.$queryRawUnsafe(
      `SELECT to_char(${LOCAL_DATE}, 'YYYY-MM-DD') AS date, ${COUNTS}
       FROM "CalendarEvent" WHERE ${where}
       GROUP BY 1 ORDER BY 1`,
      ...params
    ),
    prisma.$queryRawUnsafe(
      `SELECT year, month, day, MAX(title) AS title, MAX("promoType") AS "promoType",
         COUNT(*) FILTER (WHERE type = 'day_open') AS opens,
         COUNT(DISTINCT visitor) FILTER (WHERE type = 'day_open') AS "openVisitors",
         COUNT(*) FILTER (WHERE type IN ('scratch', 'slot'))  AS scratches,
         COUNT(*) FILTER (WHERE type = 'cta')      AS ctas
       FROM "CalendarEvent"
       WHERE ${where} AND type IN ('day_open', 'scratch', 'slot', 'cta') AND day IS NOT NULL
       GROUP BY year, month, day ORDER BY year, month, day`,
      ...params
    ),
    prisma.$queryRawUnsafe(
      `SELECT device, embedded, COUNT(*) AS views
       FROM "CalendarEvent" WHERE ${where} AND type = 'view'
       GROUP BY device, embedded ORDER BY views DESC`,
      ...params
    ),
    // svi meseci kalendara za koje postoje podaci (za izbor "Calendar")
    prisma.$queryRawUnsafe(
      `SELECT DISTINCT year, month FROM "CalendarEvent"
       WHERE year IS NOT NULL AND month IS NOT NULL ORDER BY year DESC, month DESC`
    ),
  ]);

  return {
    from,
    to,
    totals: num(totals)[0],
    byDate: num(byDate),
    byPromo: num(byPromo),
    byDevice: num(byDevice),
    calendars: num(calendars),
  };
}

export async function getEvents(range) {
  const { where, params } = filter(range);
  return prisma.$queryRawUnsafe(
    `SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Belgrade', 'YYYY-MM-DD HH24:MI:SS') AS time,
       type, year, month, day, "promoType", title, device, embedded, visitor
     FROM "CalendarEvent"
     WHERE ${where}
     ORDER BY "createdAt"
     LIMIT 200000`,
    ...params
  );
}
