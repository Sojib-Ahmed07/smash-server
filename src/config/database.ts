import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL!);

const prisma = new PrismaClient({
  adapter,
  log: ["error", "query"],
  errorFormat: "pretty",
});

export default prisma;