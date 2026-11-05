-- Otkrivanje promocije slot mašinom (alternativa grebalici)
ALTER TABLE "SpecialPromotion" ADD COLUMN IF NOT EXISTS "slot" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WeeklyPlan" ADD COLUMN IF NOT EXISTS "slot" BOOLEAN NOT NULL DEFAULT false;
