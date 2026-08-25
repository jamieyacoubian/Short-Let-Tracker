-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "passwordHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "branch" TEXT,
    "agency" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "coverage" TEXT,
    "shortLetStrength" TEXT,
    "billsLikelihood" TEXT,
    "contactBranch" TEXT,
    "searchUrl" TEXT,
    "onBriefingWatchlist" BOOLEAN NOT NULL DEFAULT false,
    "lastSearchedNote" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ArchiveLead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sheetRowId" TEXT,
    "label" TEXT NOT NULL,
    "area" TEXT,
    "priceMonthly" REAL,
    "billsNote" TEXT,
    "reasonStatus" TEXT,
    "notes" TEXT,
    "nextAction" TEXT,
    "lastCheckedAt" DATETIME,
    "sourceRow" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sheetRowId" TEXT,
    "reference" TEXT,
    "address" TEXT NOT NULL,
    "development" TEXT,
    "postcode" TEXT,
    "neighbourhood" TEXT,
    "zone" TEXT,
    "listingUrl" TEXT,
    "additionalUrls" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "priceMonthly" REAL,
    "priceWeekly" REAL,
    "billsIncluded" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "billsNotes" TEXT,
    "councilTaxNotes" TEXT,
    "wifiIncluded" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "deposit" TEXT,
    "paymentBasis" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "squareFeet" INTEGER,
    "furnished" TEXT,
    "floor" TEXT,
    "hasLift" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "parking" TEXT,
    "outdoorSpace" TEXT,
    "broadband" TEXT,
    "availableFrom" TEXT,
    "availableUntil" TEXT,
    "minTermMonths" INTEGER,
    "minTermNote" TEXT,
    "maxTermMonths" INTEGER,
    "maxTermNote" TEXT,
    "shortLetConfirmed" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "listingStatusNote" TEXT,
    "fitStatusNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "rankTier" TEXT,
    "rankScore" INTEGER,
    "nextAction" TEXT,
    "nextActionDue" DATETIME,
    "wfhSuitable" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "whyItWorks" TEXT,
    "watchOuts" TEXT,
    "wfhAssessment" TEXT,
    "layoutAssessment" TEXT,
    "quietnessAssessment" TEXT,
    "valueAssessment" TEXT,
    "verdict" TEXT,
    "ratingCafes" INTEGER,
    "ratingCalm" INTEGER,
    "ratingGreenery" INTEGER,
    "ratingEvening" INTEGER,
    "ratingCulture" INTEGER,
    "ratingTransport" INTEGER,
    "ratingLateNight" INTEGER,
    "ratingWfh" INTEGER,
    "lastVerifiedAt" DATETIME,
    "isDuplicateOf" TEXT,
    "duplicateNotes" TEXT,
    "privateNotes" TEXT,
    "sourceRow" TEXT,
    "agentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Property_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PropertyImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "listingUrl" TEXT,
    "propertyReference" TEXT,
    "category" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "retrievedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "altText" TEXT,
    CONSTRAINT "PropertyImage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContactLogEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT,
    "propertyLabel" TEXT,
    "agentId" TEXT,
    "occurredAt" DATETIME NOT NULL,
    "direction" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "sender" TEXT,
    "recipient" TEXT,
    "subject" TEXT,
    "summary" TEXT,
    "isSubstantive" BOOLEAN NOT NULL DEFAULT true,
    "gmailThreadId" TEXT,
    "gmailMessageUrl" TEXT,
    "matchConfidence" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "nextAction" TEXT,
    "sourceRow" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactLogEntry_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContactLogEntry_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Draft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sheetRowId" TEXT,
    "propertyId" TEXT NOT NULL,
    "agentName" TEXT,
    "channel" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'READY_NOT_SENT',
    "questionsCovered" TEXT,
    "duplicateCheckNote" TEXT,
    "notes" TEXT,
    "sourceRow" TEXT,
    "preparedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Draft_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Viewing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "startAt" DATETIME,
    "endAt" DATETIME,
    "proposedTimes" TEXT,
    "calendarEventId" TEXT,
    "questionsToAsk" TEXT,
    "notesAfter" TEXT,
    "decision" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Viewing_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ViewingMedia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viewingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ViewingMedia_viewingId_fkey" FOREIGN KEY ("viewingId") REFERENCES "Viewing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TransportLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "minMinutes" INTEGER NOT NULL,
    "maxMinutes" INTEGER NOT NULL,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TransportLink_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLogEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "detail" TEXT,
    "actor" TEXT NOT NULL DEFAULT 'system',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLogEntry_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "ArchiveLead_sheetRowId_key" ON "ArchiveLead"("sheetRowId");

-- CreateIndex
CREATE UNIQUE INDEX "Property_sheetRowId_key" ON "Property"("sheetRowId");

-- CreateIndex
CREATE UNIQUE INDEX "Draft_sheetRowId_key" ON "Draft"("sheetRowId");
