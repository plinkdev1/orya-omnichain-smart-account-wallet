import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      {
        emit: "event",
        level: "query",
      },
      {
        emit: "stdout",
        level: "error",
      },
      {
        emit: "stdout",
        level: "warn",
      },
    ],
  });

// Log queries in development
// Note: Query logging requires extended PrismaClient
// if (process.env.NODE_ENV !== "production") {
//   prisma.$on("query", (e: any) => {
//     console.log("Query: " + e.query);
//     console.log("Params: " + JSON.stringify(e.params));
//     console.log("Duration: " + e.duration + "ms");
//   });
// }

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
