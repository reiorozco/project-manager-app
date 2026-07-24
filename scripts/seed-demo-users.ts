import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const demoUsers = [
  { email: "manager@demo.com", role: "PROJECT_MANAGER" as const, name: "Manager Demo" },
  { email: "client@demo.com", role: "CLIENT" as const, name: "Client Demo" },
  { email: "designer@demo.com", role: "DESIGNER" as const, name: "Designer Demo" },
];

async function seedDemoUsers() {
  for (const { email, role, name } of demoUsers) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await auth.api.signUpEmail({
        body: { email, password: "demo1234", name },
      });
    }
    await prisma.user.update({
      where: { email },
      data: { role, emailVerified: true },
    });
    console.log(`Seeded: ${email} (${role})`);
  }
}

seedDemoUsers()
  .then(() => {
    console.log("Seed complete");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
