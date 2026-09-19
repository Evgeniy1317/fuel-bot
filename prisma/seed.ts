import { CountryCode, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.region.upsert({
    where: { country: CountryCode.PMR },
    update: {},
    create: {
      country: CountryCode.PMR,
      nameRu: "Приднестровье",
      nameRo: "Transnistria",
      currencyCode: "PRB",
    },
  });

  await prisma.region.upsert({
    where: { country: CountryCode.MD },
    update: {},
    create: {
      country: CountryCode.MD,
      nameRu: "Молдова",
      nameRo: "Moldova",
      currencyCode: "MDL",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
