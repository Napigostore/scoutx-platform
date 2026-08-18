import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (secret !== "fiwokan-migrate-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Add missing columns to scout_profiles on production DB
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "scout_profiles" ADD COLUMN IF NOT EXISTS "stripeConnectAccountId" TEXT;
      ALTER TABLE "scout_profiles" ADD COLUMN IF NOT EXISTS "stripeConnectStatus" TEXT DEFAULT 'NOT_CONNECTED';
    `);

    // 2. Insert migration record into _prisma_migrations table
    await prisma.$executeRawUnsafe(`
      INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES (
        gen_random_uuid()::text,
        '4f33e20_add_stripe_connect_to_scout_profile',
        NOW(),
        '20260818144500_add_stripe_connect_to_scout_profile',
        null,
        null,
        NOW(),
        1
      )
      ON CONFLICT (migration_name) DO NOTHING;
    `);

    // 3. Verify columns from information_schema.columns
    const columns = await prisma.$queryRaw<
      Array<{
        column_name: string;
        data_type: string;
        is_nullable: string;
        column_default: string | null;
      }>
    >`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'scout_profiles'
        AND column_name IN ('stripeConnectAccountId', 'stripeConnectStatus')
    `;

    // 4. Verify _prisma_migrations record
    const migrations = await prisma.$queryRaw<Array<{ migration_name: string; finished_at: Date }>>`
      SELECT migration_name, finished_at 
      FROM _prisma_migrations 
      WHERE migration_name = '20260818144500_add_stripe_connect_to_scout_profile'
    `;

    // 5. Verify Prisma scoutProfile query
    const sampleProfile = await prisma.scoutProfile.findFirst({
      select: {
        id: true,
        stripeConnectAccountId: true,
        stripeConnectStatus: true,
      },
    });

    return NextResponse.json({
      success: true,
      columns,
      migrations,
      sampleProfile,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Migration failed" },
      { status: 500 },
    );
  }
}
