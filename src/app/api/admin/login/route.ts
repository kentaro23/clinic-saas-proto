import { NextResponse } from "next/server";

import { ADMIN_PASSWORD, ADMIN_SESSION_COOKIE, ADMIN_USERNAME } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body ?? {};

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "ok", {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  return response;
}
