import "server-only";

import { prisma } from "@/lib/prisma";
import { categories as defaultCategories } from "@/lib/data";

const SEED_KEY = "default_categories_initialized";

export async function initializeDefaultCategories() {
  await prisma.$transaction(async (tx) => {
    const initialized = await tx.storeSetting.findUnique({ where: { key: SEED_KEY }, select: { id: true } });
    if (initialized) return;

    await tx.category.createMany({
      data: defaultCategories.map(([slug, name]) => ({ slug, name })),
      skipDuplicates: true,
    });
    await tx.storeSetting.upsert({
      where: { key: SEED_KEY },
      update: { value: "true" },
      create: { key: SEED_KEY, value: "true" },
    });
  });
}
