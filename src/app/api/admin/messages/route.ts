import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const messages = await prisma.messageLog.findMany({
    orderBy: { sentAt: "desc" },
    include: { reservation: true }
  });

  return NextResponse.json({ messages });
}
