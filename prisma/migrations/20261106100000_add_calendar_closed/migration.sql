-- Kalendar zatvoren za posetioce (posle kampanje): { enabled, message }
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "closed" JSONB;
