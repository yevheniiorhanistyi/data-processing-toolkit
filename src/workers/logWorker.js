import { parentPort, workerData } from "node:worker_threads";
import { createReadStream } from "node:fs";
import readline from "node:readline";

const stats = {
  total: 0,
  levels: {},
  status: { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 },
  pathCounts: {},
  responseTimeSum: 0,
};

const stream = createReadStream(workerData.inputFile, {
  start: workerData.start,
  end: workerData.end,
});

const rl = readline.createInterface({ input: stream });

rl.on("line", (line) => {
  const parts = line.split(" ");

  const level = parts[1];
  const statusCode = Number(parts[3]);
  const responseTime = Number(parts[4]);
  const path = parts[6];

  stats.total++;

  stats.levels[level] = (stats.levels[level] || 0) + 1;

  const statusClass = Math.floor(statusCode / 100) + "xx";
  stats.status[statusClass]++;

  stats.pathCounts[path] = (stats.pathCounts[path] || 0) + 1;

  stats.responseTimeSum += responseTime;
});

rl.on("close", () => {
  parentPort.postMessage(stats);
});
