-- Konfete posle grebanja (stil iz admina): { style, emoji? }
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "confetti" JSONB;
