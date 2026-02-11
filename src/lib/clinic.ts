import { prisma } from "@/lib/prisma";

export async function getOrCreateClinic() {
  const clinic = await prisma.clinic.findFirst();
  if (clinic) return clinic;
  return prisma.clinic.create({ data: { name: "みらいクリニック" } });
}
