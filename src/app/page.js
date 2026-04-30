// src/app/page.js
import CalendarGrid from "@/components/CalendarGrid";
import CalendarEnhancer from "@/components/CalendarEnhancer";
import MonthPagination from "@/components/MonthPagination";
import prisma from "@/lib/db";
import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import SnowOverlay from "@/components/SnowOverlay";
import AdminLogoutButton from "@/components/AdminLogoutButton";

// -------------------------
// HELPERS
// -------------------------
function getParam(sp, key) {
  if (!sp) return undefined;
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

function getTextFromTranslations(row, lang) {
  const translations = row.translations || {};

  const t =
    translations[lang] ||
    (Object.keys(translations).length
      ? translations[Object.keys(translations)[0]]
      : null);

  return {
    title: t?.title ?? row.title ?? "",
    button: t?.button ?? row.button ?? "",
    link: t?.link ?? row.link ?? "#",
    richHtml: t?.richHtml ?? row.richHtml ?? null,
  };
}

function normWeeklyRows(rows = [], lang) {
  const out = Array(7).fill(null);
  for (const r of rows) {
    if (typeof r.weekday === "number" && r.weekday >= 0 && r.weekday <= 6) {
      const t = getTextFromTranslations(r, lang);
      out[r.weekday] = {
        title: t.title,
        icon: r.icon || "",
        richHtml: t.richHtml,
        link: t.link,
        button: t.button,
        active: !!r.active,
        buttonColor: r.buttonColor || "green",
        category: r.category || "ALL",
        scratch: !!r.scratch,
      };
    }
  }
  return out;
}

function normalizeSpecials(rows = [], lang) {
  return rows.map((r) => {
    const t = getTextFromTranslations(r, lang);
    return {
      year: r.year,
      month: r.month,
      day: r.day,
      title: t.title,
      icon: r.icon || "",
      richHtml: t.richHtml,
      link: t.link,
      button: t.button,
      active: !!r.active,
      buttonColor: r.buttonColor || "green",
      category: r.category || "ALL",
      scratch: !!r.scratch,
    };
  });
}


const BASE_URL = "https://calendar.meridianbet.rs";

// Keširani DB upiti za promo sadržaj — 5 minuta (settings se uvek čitaju sveže)
const getPromoData = unstable_cache(
  async (year, month) => {
    const [weeklyPlanRows, specialRows] = await Promise.all([
      prisma.weeklyPlan.findMany({ where: { year, month }, orderBy: { weekday: "asc" } }),
      prisma.specialPromotion.findMany({ where: { year, month }, orderBy: [{ day: "asc" }] }),
    ]);
    return { weeklyPlanRows, specialRows };
  },
  ["promo-data"],
  { revalidate: 300, tags: ["calendar"] }
);

// Vraća {y, m} najbližeg meseca sa promocijama u datom smeru, preskačući neaktivne mesece
async function findNearestMonthWithPromos(currentY, currentM, direction, inactiveSet = new Set()) {
  const isNext = direction === "next";

  const dirFilter = isNext
    ? { OR: [{ year: { gt: currentY } }, { year: currentY, month: { gt: currentM } }] }
    : { OR: [{ year: { lt: currentY } }, { year: currentY, month: { lt: currentM } }] };
  const dirOrder = isNext
    ? [{ year: "asc" }, { month: "asc" }]
    : [{ year: "desc" }, { month: "desc" }];

  const [special, plan] = await Promise.all([
    prisma.specialPromotion.findFirst({ where: { active: true, ...dirFilter }, orderBy: dirOrder }),
    prisma.weeklyPlan.findFirst({ where: { active: true, ...dirFilter }, orderBy: dirOrder }),
  ]);

  if (!special && !plan) return null;

  let candidate;
  if (!special) candidate = { y: plan.year, m: plan.month };
  else if (!plan) candidate = { y: special.year, m: special.month };
  else {
    const sOrd = special.year * 12 + special.month;
    const pOrd = plan.year * 12 + plan.month;
    const closer = isNext ? (sOrd <= pOrd ? special : plan) : (sOrd >= pOrd ? special : plan);
    candidate = { y: closer.year, m: closer.month };
  }

  // Ako je kandidat deaktiviran, traži sledeći u istom smeru
  if (inactiveSet.has(`${candidate.y}-${candidate.m}`)) {
    return findNearestMonthWithPromos(candidate.y, candidate.m, direction, inactiveSet);
  }

  return candidate;
}

// -------------------------
// METADATA (canonical po mesecu)
// -------------------------
const MONTH_NAMES_SR = [
  "Januar", "Februar", "Mart", "April", "Maj", "Jun",
  "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar",
];

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const yRaw = Array.isArray(sp?.y) ? sp.y[0] : sp?.y;
  const mRaw = Array.isArray(sp?.m) ? sp.m[0] : sp?.m;

  const now = new Date();
  const year = Number.isInteger(parseInt(yRaw)) ? parseInt(yRaw) : now.getFullYear();
  const month =
    Number.isInteger(parseInt(mRaw)) && parseInt(mRaw) >= 0 && parseInt(mRaw) <= 11
      ? parseInt(mRaw)
      : now.getMonth();

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const canonical = isCurrentMonth
    ? `${BASE_URL}/`
    : `${BASE_URL}/?y=${year}&m=${month}`;

  const monthSr = MONTH_NAMES_SR[month];
  const title = `Kalendar Promocija ${monthSr} ${year} | Meridianbet`;
  const description = `Otkrijte dnevne promocije za ${monthSr} ${year}. Iskoristite ekskluzivne nagrade uz Meridianbet Kalendar Promocija.`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "sr": canonical,
        "x-default": canonical,
      },
    },
    openGraph: {
      url: canonical,
      title,
      description,
    },
    twitter: {
      title,
      description,
    },
  };
}

// -------------------------
// PAGE COMPONENT
// -------------------------
export default async function Home({ searchParams }) {
  const sp = await searchParams;

  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("admin_auth");
  const isAdmin = !!adminCookie?.value;

  const now = new Date();

  const yRaw = getParam(sp, "y");
  const mRaw = getParam(sp, "m");
  const lang = "sr";

  const reqYear = Number.parseInt(yRaw ?? "", 10);
  const reqMonth = Number.parseInt(mRaw ?? "", 10);

  const MIN_YEAR = 2024;
  const MAX_YEAR = now.getFullYear() + 2;

  const year =
    Number.isInteger(reqYear) && reqYear >= MIN_YEAR && reqYear <= MAX_YEAR
      ? reqYear
      : now.getFullYear();
  const month =
    Number.isInteger(reqMonth) && reqMonth >= 0 && reqMonth <= 11
      ? reqMonth
      : now.getMonth();

  // CalendarSettings se uvek čita sveže (inactive flag mora biti trenutan)
  const calendarSettings = await prisma.calendarSettings.findFirst();
  const monthBgs = calendarSettings?.monthBackgrounds || {};

  // Redirect korisnika sa deaktiviranog meseca
  if (monthBgs[`${year}-${month}`]?.inactive && !isAdmin) {
    const inactiveSet = new Set(
      Object.entries(monthBgs)
        .filter(([, v]) => v?.inactive)
        .map(([k]) => k)
    );
    const nearest =
      await findNearestMonthWithPromos(year, month, "next", inactiveSet) ||
      await findNearestMonthWithPromos(year, month, "prev", inactiveSet);
    if (nearest) redirect(`/?y=${nearest.y}&m=${nearest.m}`);
  }

  // Load promo data — admin dobija live podatke, korisnici keširane (5 min)
  const { weeklyPlanRows, specialRows } =
    isAdmin
      ? await (async () => {
          const [weeklyPlanRows, specialRows] = await Promise.all([
            prisma.weeklyPlan.findMany({ where: { year, month }, orderBy: { weekday: "asc" } }),
            prisma.specialPromotion.findMany({ where: { year, month }, orderBy: [{ day: "asc" }] }),
          ]);
          return { weeklyPlanRows, specialRows };
        })()
      : await getPromoData(year, month);

  const planned = normWeeklyRows(weeklyPlanRows, lang);

  const weekly = Array.from(
    { length: 7 },
    (_, i) =>
      planned[i] ?? {
        title: "",
        icon: "",
        richHtml: null,
        link: "#",
        button: "",
        active: false,
        buttonColor: "green",
        category: "ALL",
      }
  );

  const specials = normalizeSpecials(specialRows, lang);

  // logo
  const logoUrl = calendarSettings?.logoUrl || "/img/meridianbet-ng.png";

  // background za kalendar — per-month override ima prioritet nad globalnim
  const monthBg = monthBgs[`${year}-${month}`] || {};
  const bgImageUrl = monthBg.desktop || calendarSettings?.bgImageUrl || "/img/bg-calendar.png";
  const bgImageUrlMobile = monthBg.mobile || calendarSettings?.bgImageUrlMobile || bgImageUrl;

  // pozicija kalendara — per-month override > global default
  const pos = monthBg.position || calendarSettings?.calendarPosition || "left";
  const mainJustify =
    pos === "center" ? "md:justify-center" :
    pos === "right"  ? "md:justify-end" :
                       "md:justify-start";
  const innerMargin =
    pos === "center" ? "mx-auto" :
    pos === "right"  ? "mx-auto md:mx-0 md:ml-auto" :
                       "mx-auto md:mx-0 md:mr-auto";
  const headingAlign =
    pos === "center" ? "md:text-center" :
    pos === "right"  ? "md:text-right" :
                       "md:text-left";

  // naslov kalendara — per-month override > global calendarTitle > hardcoded fallback
  const monthTitle = monthBg.titleSr;
  const globalTitles = calendarSettings?.calendarTitle || {};
  const calendarTitle = monthTitle || globalTitles["sr"] || "PRAZNIČNE MISIJE";

  // tema kalendara — per-month override > global default
  const theme = monthBg.theme || calendarSettings?.theme || "default";

  // Skup deaktivovanih meseci za paginaciju
  const inactiveSet = new Set(
    Object.entries(monthBgs)
      .filter(([, v]) => v?.inactive)
      .map(([k]) => k)
  );

  const isMonthInactive = !!monthBg.inactive;

  // Pagination for months — preskačemo deaktivovane mesece
  const [prevMonth, nextMonth] = await Promise.all([
    findNearestMonthWithPromos(year, month, "prev", inactiveSet),
    findNearestMonthWithPromos(year, month, "next", inactiveSet),
  ]);

   return (
    <>
      {/* TOP HEADER BAR */}
      <div className="min-h-[100dvh] flex flex-col overflow-hidden">
        <header className="w-full bg-[linear-gradient(90deg,#A6080E_0%,#D11101_100%)] px-4 md:px-16 py-2 flex items-center justify-between shrink-0">
          <a
            href="https://meridianbet.rs"
            target="_blank"
            rel="noreferrer"
            aria-label="Meridianbet Calendar main site"
          >
            <img
              src={logoUrl}
              alt="Meridianbet"
              className="h-5 md:h-[25px] w-auto"
            />
          </a>

        </header>

        <main
          className={`relative z-0 w-full flex-1 bg-no-repeat bg-cover bg-center calendar-bg overflow-hidden md:overflow-auto flex justify-center ${mainJustify}`}
          style={{ backgroundImage: `url("${bgImageUrl}")` }}
        >
          {/* MOBILE BG */}
          <div
            className="pointer-events-none absolute inset-0 md:hidden bg-no-repeat bg-cover bg-center -z-10 calendar-mobile-bg"
            style={{
              backgroundImage: `url("${bgImageUrlMobile}")`,
            }}
          />

          <SnowOverlay />

          <div
            className={`relative z-10 w-full max-w-6xl px-4 sm:px-6 md:px-10 lg:px-16 pt-4 pb-4 md:pt-6 md:pb-10 ${innerMargin}`}
          >
            <h1 className={`text-3xl md:text-5xl font-extrabold tracking-tight text-white text-center ${headingAlign} my-[30px]`}>
              {calendarTitle}
            </h1>

            {isAdmin && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded bg-amber-500/20 text-amber-200 px-3 py-1 text-sm">
                  <span>Admin preview</span>
                  <a
                    href="/admin"
                    className="underline hover:text-white transition-colors"
                    title="Go to dashboard"
                  >
                    Dashboard
                  </a>
                  <AdminLogoutButton />
                </div>
                {isMonthInactive && (
                  <div className="inline-flex items-center gap-1.5 rounded bg-red-700/40 text-red-200 border border-red-500/40 px-3 py-1 text-sm">
                    <span>⚠ Mesec deaktiviran — nije vidljiv korisnicima</span>
                    <a
                      href="/admin/calendar-style/monthly"
                      className="underline hover:text-white transition-colors"
                    >
                      Izmeni
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* MOBILE PAGINATION — skriva se za football temu (paginacija je unutar CalendarMobileFootball) */}
            {theme !== "football" && (
              <div className="mt-6 flex items-center justify-center md:hidden">
                <MonthPagination
                  year={year}
                  month={month}
                  prevMonth={prevMonth}
                  nextMonth={nextMonth}
                  className="text-sm"
                />
              </div>
            )}

            <div className="mt-6">
              <CalendarGrid
                year={year}
                month={month}
                weekly={weekly}
                specials={specials}
                adminPreview={isAdmin}
                lang={lang}
                theme={theme}
                prevMonth={prevMonth}
                nextMonth={nextMonth}
              />
            </div>

            <CalendarEnhancer adminPreview={isAdmin} lang={lang} />

            {/* DESKTOP PAGINATION */}
            <div className="hidden md:flex items-center justify-center">
              <MonthPagination
                year={year}
                month={month}
                prevMonth={prevMonth}
                nextMonth={nextMonth}
                className="text-base"
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
