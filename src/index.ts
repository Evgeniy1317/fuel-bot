import { createBot } from "./bot";
import { prisma } from "./lib/prisma";
import { startJobs } from "./jobs";

async function main() {
  const bot = createBot();
  startJobs(bot);

  await bot.api.setMyCommands([
    { command: "start", description: "Старт / Start" },
    { command: "menu", description: "Меню / Meniu" },
    { command: "subscribe", description: "Подписка / Abonament" },
    { command: "top", description: "Рейтинг / Clasament" },
    { command: "language", description: "Язык / Limbă" },
  ]);

  console.log("fuel-bot started");
  await bot.start();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
