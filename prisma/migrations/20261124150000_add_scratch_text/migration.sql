-- Natpis na srećki (grebalica): tekst na zlatnoj kartici pre grebanja, npr. „IGRAM NA SIGURNO“.
-- Samo dodaje prazno polje — postojeći podaci se ne menjaju.
ALTER TABLE "SpecialPromotion" ADD COLUMN IF NOT EXISTS "scratchText" TEXT;
ALTER TABLE "WeeklyPlan" ADD COLUMN IF NOT EXISTS "scratchText" TEXT;
