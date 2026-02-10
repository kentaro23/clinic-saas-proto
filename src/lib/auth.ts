import { cookies } from "next/headers";

export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "demo123";
export const ADMIN_SESSION_COOKIE = "clinic_demo_admin";

export function isAdminSession() {
  const cookieStore = cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return session === "ok";
}
import { redirect } from "next/navigation";

const COOKIE_NAME = "demo_admin";
const ADMIN_USER = process.env.DEMO_ADMIN_USER ?? "admin";
const ADMIN_PASS = process.env.DEMO_ADMIN_PASS ?? "admin123";

export const verifyAdminCredentials = (username: string, password: string) =>
  username === ADMIN_USER && password === ADMIN_PASS;

export const setAdminSession = () => {
  cookies().set(COOKIE_NAME, "signed-in", {
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
  return cookies().get(COOKIE_NAME)?.value === "signed-in";
};

export const requireAdmin = () => {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }
};
