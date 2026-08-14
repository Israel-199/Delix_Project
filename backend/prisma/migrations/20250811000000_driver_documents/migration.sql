-- Driver document storage for Cloudinary URLs
CREATE TYPE "DriverDocumentType" AS ENUM ('LICENSE', 'NATIONAL_ID', 'REGISTRATION_BOOK', 'INSURANCE');

CREATE TABLE IF NOT EXISTS "DriverDocument" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "type" "DriverDocumentType" NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DriverDocument_driverId_type_key"
ON "DriverDocument"("driverId", "type");

CREATE INDEX IF NOT EXISTS "DriverDocument_driverId_idx"
ON "DriverDocument"("driverId");

ALTER TABLE "DriverDocument"
ADD CONSTRAINT "DriverDocument_driverId_fkey"
FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
