import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_SESSION_COOKIE = "demo_admin";

const COOKIE_NAME = ADMIN_SESSION_COOKIE;

export function isAdminSession() {
  return isAdminAuthenticated();
}

export const setAdminSession = (adminUserId: string) => {
  cookies().set(COOKIE_NAME, `user:${adminUserId}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
};

export const setSuperAdminSession = () => {
  cookies().set(COOKIE_NAME, "super", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
};

export const clearAdminSession = () => {
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
};

export const isAdminAuthenticated = () => {
  const value = cookies().get(COOKIE_NAME)?.value;
  return Boolean(value);
};

export const getAdminSessionValue = () => {
  return cookies().get(COOKIE_NAME)?.value ?? null;
};

export const isSuperAdminAuthenticated = () => {
  return getAdminSessionValue() === "super";
};

export const requireAdmin = () => {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }
};
