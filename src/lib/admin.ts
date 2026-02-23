import { getAdminSessionValue } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AdminContext =
  | { role: "super"; adminUserId: null; clinicId: null }
  | { role: "clinic"; adminUserId: string; clinicId: string };

export async function getAdminContext(): Promise<AdminContext | null> {
  const value = getAdminSessionValue();
  if (!value) return null;
  if (value === "super") {
    return { role: "super", adminUserId: null, clinicId: null };
  }
  if (value.startsWith("user:")) {
    const adminUserId = value.replace("user:", "");
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: adminUserId },
      select: { id: true, clinicId: true }
    });
    if (!adminUser) return null;
    return { role: "clinic", adminUserId: adminUser.id, clinicId: adminUser.clinicId };
  }
  return null;
}

export async function requireClinicId(): Promise<string | null> {
  const context = await getAdminContext();
  if (!context) return null;
  if (context.role === "clinic") return context.clinicId;
  return null;
}

export async function getClinicIdFromRequest(
  request: Request,
  body?: Record<string, unknown> | null
) {
  const context = await getAdminContext();
  if (!context) return null;
  if (context.role === "clinic") return context.clinicId;
  const { searchParams } = new URL(request.url);
  const clinicId =
    (body?.clinicId as string | undefined) ?? searchParams.get("clinicId") ?? null;
  return clinicId;
}
