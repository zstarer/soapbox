-- AlterTable
ALTER TABLE "User" ADD COLUMN     "settings" JSONB DEFAULT '{}',
ADD COLUMN     "subscriptionTier" TEXT DEFAULT 'free',
ADD COLUMN     "workspaces" JSONB[] DEFAULT ARRAY[]::JSONB[];
