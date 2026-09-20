import { createServer } from "http";
import { createBot } from "./bot";
import { prisma } from "./lib/prisma";
import { startJobs } from "./jobs";

function listenHealth() {
  const port = Number(process.env.PORT);
  if (!Number.isFinite(port) || port <= 0) {
    return;
  }
  createServer((_req, res) => {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("ok");
  }).listen(port, () => {
    console.log(`health on :${port}`);
  });
}

async function main() {
  listenHealth();
  const bot = createBot();
  startJobs(bot);

  await bot.api.setMyCommands([
    { command: "start", description: "Старт / Start" },
    { command: "menu", description: "Меню / Meniu" },
    { command: "subscribe", description: "Подписка / Abonament" },
    { command: "top", description: "Экономия / рейтинг" },
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
