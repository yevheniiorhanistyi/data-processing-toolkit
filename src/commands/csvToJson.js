import { createReadStream, createWriteStream } from "node:fs";
import { access } from "node:fs/promises";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

import { parseArgs } from "../utils/argParser.js";
import { resolvePath } from "../utils/pathResolver.js";

export const csvToJson = async (currentDir, args) => {
  const { input, output } = parseArgs(args);

  if (!input || !output) {
    console.log("Invalid input");
    return;
  }

  const inputFile = resolvePath(currentDir, input);
  const outputFile = resolvePath(currentDir, output);

  try {
    await access(inputFile);
  } catch (error) {
    throw new Error("Operation failed");
  }

  const parseLine = (line, headers) => {
    const values = line.split(",");
    const obj = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = (values[index] || "").trim();
    });
    return obj;
  };

  const transformStream = new Transform({
    transform(chunk, _, callback) {
      const data = this.leftover + chunk.toString();
      const lines = data.split(/\r?\n/);
      this.leftover = lines.pop();

      if (this.isFirstLine && lines.length > 0) {
        const headerLine = lines.shift();
        this.headers = headerLine.split(",").map((h) => h.trim());
        this.isFirstLine = false;
        this.push("[\n");
      }

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const jsonObject = parseLine(trimmed, this.headers);
        const prefix = this.isFirstObject ? "  " : ",\n  ";
        this.push(prefix + JSON.stringify(jsonObject));
        this.isFirstObject = false;
      }
      callback();
    },
    flush(callback) {
      const trimmed = this.leftover.trim();

      if (trimmed) {
        const obj = parseLine(trimmed, this.headers);
        const prefix = this.isFirstObject ? "  " : ",\n  ";
        this.push(prefix + JSON.stringify(obj));
      }

      this.push("\n]");
      callback();
    },
  });

  transformStream.headers = [];
  transformStream.isFirstLine = true;
  transformStream.leftover = "";
  transformStream.isFirstObject = true;

  try {
    await pipeline(
      createReadStream(inputFile, { encoding: "utf-8" }),
      transformStream,
      createWriteStream(outputFile),
    );
  } catch {
    throw new Error("Operation failed");
  }
};
