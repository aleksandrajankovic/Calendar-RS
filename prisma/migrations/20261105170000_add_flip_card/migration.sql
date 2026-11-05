-- Flip kartica: slika promocije koja se dodirom okreće na detalje (sama ili posle grebanja)
ALTER TABLE "SpecialPromotion" ADD COLUMN IF NOT EXISTS "flipCard" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WeeklyPlan" ADD COLUMN IF NOT EXISTS "flipCard" BOOLEAN NOT NULL DEFAULT false;
