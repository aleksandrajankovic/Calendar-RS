-- Prekidač za prikaz loga u traci na vrhu kalendara (podrazumevano isključen)
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "showLogo" BOOLEAN NOT NULL DEFAULT false;
