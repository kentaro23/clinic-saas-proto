import { compare, hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE } from "@/lib/auth";
import { getOrCreateClinic } from "@/lib/clinic";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body ?? {};

  const superUser = process.env.SUPER_ADMIN_USER;
  const superPass = process.env.SUPER_ADMIN_PASS;
  if (superUser && superPass && username === superUser && password === superPass) {
    const response = NextResponse.json({ ok: true, role: "super" });
    response.cookies.set(ADMIN_SESSION_COOKIE, "super", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });
    return response;
  }

  let adminUser = await prisma.adminUser.findUnique({
    where: { username }
  });
  if (!adminUser) {
    const demoUser = process.env.DEMO_ADMIN_USER ?? "admin";
    const demoPass = process.env.DEMO_ADMIN_PASS ?? "admin123";
    if (username === demoUser && password === demoPass) {
      const clinic = await getOrCreateClinic();
      const passwordHash = await hash(demoPass, 10);
      adminUser = await prisma.adminUser.create({
        data: {
          clinicId: clinic.id,
          username: demoUser,
          passwordHash,
          role: "clinic"
        }
      });
    } else {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
  }
  const ok = await compare(password ?? "", adminUser.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, role: "clinic" });
  response.cookies.set(ADMIN_SESSION_COOKIE, `user:${adminUser.id}`, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  return response;
}
