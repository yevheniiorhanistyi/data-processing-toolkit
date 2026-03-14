import os from "os";
import { Worker } from "node:worker_threads";
import { open, stat, writeFile } from "node:fs/promises";

import { parseArgs } from "../utils/argParser.js";
import { resolvePath } from "../utils/pathResolver.js";

async function findNewline(handle, position, fileSize) {
  const buffer = Buffer.alloc(1);
  let currentPos = position;

  while (currentPos < fileSize) {
    await handle.read(buffer, 0, 1, currentPos);
    if (buffer[0] === 10) return currentPos;
    currentPos++;
  }

  return fileSize - 1;
}

export const logStats = async (currentDir, args) => {
  const { input, output } = parseArgs(args);

  if (!input || !output) {
    console.log("Invalid input");
    return;
  }

  const inputFile = resolvePath(currentDir, input);
  const outputFile = resolvePath(currentDir, output);

  const cpuCount = os.cpus().length;

  try {
    const stats = await stat(inputFile);
    const fileSize = stats.size;

    const chunkSize = Math.floor(fileSize / cpuCount);
    const chunks = [];

    const fileHandle = await open(inputFile, "r");

    let currentStart = 0;

    for (let i = 0; i < cpuCount; i++) {
      let end;

      if (i === cpuCount - 1) {
        end = fileSize - 1;
      } else {
        end = await findNewline(fileHandle, currentStart + chunkSize, fileSize);
      }

      chunks.push({ start: currentStart, end });
      currentStart = end + 1;
    }

    await fileHandle.close();

    const workers = chunks.map(
      (chunk) =>
        new Promise((resolve, reject) => {
          const worker = new Worker(
            new URL("../workers/logWorker.js", import.meta.url),
            {
              workerData: {
                inputFile,
                start: chunk.start,
                end: chunk.end,
              },
            },
          );

          worker.on("message", resolve);
          worker.on("error", reject);

          worker.on("exit", (code) => {
            if (code !== 0) reject(new Error("Worker stopped"));
          });
        }),
    );

    const results = await Promise.all(workers);

    const final = {
      total: 0,
      levels: {},
      status: { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 },
      pathCounts: {},
      responseTimeSum: 0,
    };

    for (const r of results) {
      final.total += r.total;
      final.responseTimeSum += r.responseTimeSum;

      for (const [k, v] of Object.entries(r.levels)) {
        final.levels[k] = (final.levels[k] || 0) + v;
      }

      for (const [k, v] of Object.entries(r.status)) {
        final.status[k] += v;
      }

      for (const [k, v] of Object.entries(r.pathCounts)) {
        final.pathCounts[k] = (final.pathCounts[k] || 0) + v;
      }
    }

    const topPaths = Object.entries(final.pathCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const avgResponseTimeMs = final.total
      ? Number((final.responseTimeSum / final.total).toFixed(2))
      : 0;

    const outputData = {
      total: final.total,
      levels: final.levels,
      status: final.status,
      topPaths,
      avgResponseTimeMs,
    };

    await writeFile(outputFile, JSON.stringify(outputData, null, 2));
  } catch {
    throw new Error("Operation failed");
  }
};
