-- CreateEnum
CREATE TYPE "LatePolicy" AS ENUM ('OPEN', 'REQUEST', 'BLOCK');

-- CreateEnum
CREATE TYPE "LateRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "latePolicy" "LatePolicy" NOT NULL DEFAULT 'OPEN';

-- CreateTable
CREATE TABLE "LateRequest" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "LateRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "LateRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LateRequest_assignmentId_status_idx" ON "LateRequest"("assignmentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LateRequest_assignmentId_studentId_key" ON "LateRequest"("assignmentId", "studentId");

-- AddForeignKey
ALTER TABLE "LateRequest" ADD CONSTRAINT "LateRequest_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LateRequest" ADD CONSTRAINT "LateRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Как и остальные таблицы: закрываем от анонимного доступа через PostgREST.
ALTER TABLE "LateRequest" ENABLE ROW LEVEL SECURITY;
