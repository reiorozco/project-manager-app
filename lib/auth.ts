import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import prisma from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  trustedOrigins: [
    "https://project-manager-app-cyan.vercel.app",
    "https://*.vercel.app",
    "http://localhost:3000",
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: {
        type: ["CLIENT", "PROJECT_MANAGER", "DESIGNER"] as const,
        required: false,
        defaultValue: "CLIENT",
        input: false,
      },
    },
  },
  plugins: [nextCookies()],
});
