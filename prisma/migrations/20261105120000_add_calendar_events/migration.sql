-- Analitika kalendara: događaji (prikaz, otvaranje dana, grebanje, klik na dugme)
CREATE TABLE IF NOT EXISTS "CalendarEvent" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "year" INTEGER,
    "month" INTEGER,
    "day" INTEGER,
    "promoType" TEXT,
    "title" TEXT,
    "device" TEXT,
    "embedded" BOOLEAN NOT NULL DEFAULT false,
    "visitor" TEXT,
    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CalendarEvent_createdAt_idx" ON "CalendarEvent"("createdAt");
CREATE INDEX IF NOT EXISTS "CalendarEvent_year_month_day_idx" ON "CalendarEvent"("year", "month", "day");
