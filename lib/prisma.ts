import { PrismaClient } from "@prisma/client"

let dbUrl = process.env.DATABASE_URL
if (dbUrl && !dbUrl.includes("pgbouncer=true") && !dbUrl.includes("statement_cache_size=0")) {
  const separator = dbUrl.includes("?") ? "&" : "?"
  dbUrl = `${dbUrl}${separator}pgbouncer=true&statement_cache_size=0`
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma && typeof (globalForPrisma.prisma as any).calendarEvent !== "undefined"
    ? globalForPrisma.prisma
    : new PrismaClient({
        datasources: dbUrl
          ? {
              db: {
                url: dbUrl,
              },
            }
          : undefined,
      })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

