import { NextResponse } from "next/server";
import { DependencyHealthChecker } from "@scoutx/observability";

const checker = new DependencyHealthChecker([
  {
    name: "application",
    check: async () => ({ status: "UP" }),
  },
  {
    name: "database",
    check: async () => {
      // Simple DB check stub
      return { status: "UP" };
    },
  },
  {
    name: "configuration",
    check: async () => {
      return { status: "UP" };
    },
  },
]);

export async function GET() {
  const result = await checker.checkAll();
  return NextResponse.json(result, { status: result.status === "UP" ? 200 : 503 });
}
