-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sid" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Viewer',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "site" TEXT,
    "operationalCapacity" DOUBLE PRECISION,
    "commissionDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Active',
    "defaultCostPerMeter" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientName" TEXT,
    "location" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "contractedRate" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrillingEntry" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "shift" TEXT NOT NULL,
    "rigId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "metersDrilled" DOUBLE PRECISION NOT NULL,
    "holeDepth" DOUBLE PRECISION,
    "bitType" TEXT,
    "formation" TEXT,
    "mudType" TEXT,
    "totalShiftHours" DOUBLE PRECISION NOT NULL DEFAULT 12,
    "drillingHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mechanicalDowntime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "operationalDelay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weatherDowntime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "safetyDowntime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "waitingOnParts" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "standbyHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nptHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "downtimeCategory" TEXT,
    "fuelConsumed" DOUBLE PRECISION,
    "consumablesCost" DOUBLE PRECISION,
    "remarks" TEXT,
    "supervisorName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Submitted',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrillingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialParam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'global',
    "rigId" TEXT,
    "projectId" TEXT,
    "costPerMeter" DOUBLE PRECISION,
    "fuelCostFactor" DOUBLE PRECISION,
    "consumablesFactor" DOUBLE PRECISION,
    "laborCostFactor" DOUBLE PRECISION,
    "defaultShiftHours" DOUBLE PRECISION DEFAULT 12,
    "targetAvailability" DOUBLE PRECISION DEFAULT 90,
    "targetUtilization" DOUBLE PRECISION DEFAULT 75,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialParam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceLog" (
    "id" TEXT NOT NULL,
    "equipmentName" TEXT NOT NULL,
    "maintenanceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rigId" TEXT,
    "cost" DOUBLE PRECISION,
    "hoursSpent" DOUBLE PRECISION,
    "performedBy" TEXT,
    "datePerformed" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentReport" (
    "id" TEXT NOT NULL,
    "incidentType" TEXT NOT NULL,
    "dateOccurred" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DowntimeLog" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "durationHours" DOUBLE PRECISION,
    "description" TEXT NOT NULL,
    "equipmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DowntimeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "action" TEXT NOT NULL,
    "changedField" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherLog" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "rainfall" DOUBLE PRECISION NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION,
    "isRainy" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeatherLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_sid_key" ON "Session"("sid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Rig_name_key" ON "Rig"("name");

-- CreateIndex
CREATE INDEX "DrillingEntry_date_idx" ON "DrillingEntry"("date");

-- CreateIndex
CREATE INDEX "DrillingEntry_rigId_idx" ON "DrillingEntry"("rigId");

-- CreateIndex
CREATE INDEX "DrillingEntry_projectId_idx" ON "DrillingEntry"("projectId");

-- CreateIndex
CREATE INDEX "DrillingEntry_date_rigId_idx" ON "DrillingEntry"("date", "rigId");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherLog_date_key" ON "WeatherLog"("date");

-- AddForeignKey
ALTER TABLE "DrillingEntry" ADD CONSTRAINT "DrillingEntry_rigId_fkey" FOREIGN KEY ("rigId") REFERENCES "Rig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrillingEntry" ADD CONSTRAINT "DrillingEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrillingEntry" ADD CONSTRAINT "DrillingEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialParam" ADD CONSTRAINT "FinancialParam_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceLog" ADD CONSTRAINT "MaintenanceLog_rigId_fkey" FOREIGN KEY ("rigId") REFERENCES "Rig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceLog" ADD CONSTRAINT "MaintenanceLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentReport" ADD CONSTRAINT "IncidentReport_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
