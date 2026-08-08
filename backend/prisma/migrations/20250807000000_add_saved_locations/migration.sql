-- CreateTable SavedLocation
CREATE TABLE IF NOT EXISTS "SavedLocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "placeName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "selectionCount" INTEGER NOT NULL DEFAULT 1,
    "lastSelectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedLocation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SavedLocation_userId_latitude_longitude_key"
ON "SavedLocation"("userId", "latitude", "longitude");

CREATE INDEX IF NOT EXISTS "SavedLocation_userId_lastSelectedAt_idx"
ON "SavedLocation"("userId", "lastSelectedAt");

ALTER TABLE "SavedLocation"
ADD CONSTRAINT "SavedLocation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
