import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? [
            { emit: "event", level: "query" },
            { emit: "stdout", level: "error" },
            { emit: "stdout", level: "warn" },
          ]
        : [
            { emit: "stdout", level: "error" },
          ],
  });

// Log slow queries in development (queries taking > 1000ms)
if (process.env.NODE_ENV === "development") {
  prisma.$on("query", (e) => {
    if (e.duration > 1000) {
      console.log(`⚠️  [Slow Query] ${e.duration}ms: ${e.query}`);
    }
  });
}

// Graceful shutdown - disconnect on exit
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;