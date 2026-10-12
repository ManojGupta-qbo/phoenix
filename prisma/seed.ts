import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);
  await db.user.upsert({
    where: { email: "admin@phoenix.test" },
    update: {},
    create: { email: "admin@phoenix.test", name: "Clinic Admin", role: "ADMIN", passwordHash },
  });
  await db.user.upsert({
    where: { email: "patient@phoenix.test" },
    update: {},
    create: { email: "patient@phoenix.test", name: "Pat Patient", role: "PATIENT", passwordHash },
  });

  const experts = [
    { email: "dr.rao@phoenix.test", name: "Dr. Asha Rao", specialty: "General Physician", qualifications: "MBBS, MD (Reg. 12345)" },
    { email: "dr.lee@phoenix.test", name: "Dr. Sam Lee", specialty: "Dermatology", qualifications: "MBBS, DDVL (Reg. 67890)" },
  ];
  for (const e of experts) {
    const user = await db.user.upsert({
      where: { email: e.email },
      update: {},
      create: {
        email: e.email, name: e.name, role: "EXPERT", passwordHash,
        expertProfile: { create: { specialty: e.specialty, qualifications: e.qualifications, bio: `${e.specialty} with 10+ years of experience.`, feeCents: 50000, verified: true } },
      },
      include: { expertProfile: true },
    });
    const profile = user.expertProfile!;
    if ((await db.slot.count({ where: { expertId: profile.id } })) === 0) {
      const base = new Date();
      base.setUTCHours(base.getUTCHours() + 24, 0, 0, 0);
      await db.slot.createMany({
        data: Array.from({ length: 6 }, (_, i) => {
          const startsAt = new Date(base.getTime() + i * 60 * 60_000);
          return { expertId: profile.id, startsAt, endsAt: new Date(startsAt.getTime() + 30 * 60_000) };
        }),
      });
    }
  }
}

main().finally(() => db.$disconnect());
