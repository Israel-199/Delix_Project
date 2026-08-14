-- User account blocking
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isBlocked" BOOLEAN NOT NULL DEFAULT false;

-- Global authoritative pricing settings (singleton row)
CREATE TABLE IF NOT EXISTS "PricingSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "baseFare" DOUBLE PRECISION NOT NULL DEFAULT 300,
    "distanceRatePerKm" DOUBLE PRECISION NOT NULL DEFAULT 90,
    "waitingRatePerHour" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "PricingSettings" ("id", "baseFare", "distanceRatePerKm", "waitingRatePerHour", "updatedAt")
VALUES ('default', 300, 90, 50, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
