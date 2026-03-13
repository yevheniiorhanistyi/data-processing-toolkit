import { createReadStream, createWriteStream } from "node:fs";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

import { parseArgs } from "../utils/argParser.js";
import { resolvePath } from "../utils/pathResolver.js";

export const jsonToCsv = async (currentDir, args) => {
  const { input, output } = parseArgs(args);

  if (!input || !output) {
    console.log("Invalid input");
    return;
  }

  const inputFile = resolvePath(currentDir, input);
  const outputFile = resolvePath(currentDir, output);

  const transformStream = new Transform({
    transform(chunk, _, callback) {
      this.bufferedData += chunk.toString();
      callback();
    },
    flush(callback) {
      const jsonArray = JSON.parse(this.bufferedData);

      if (!Array.isArray(jsonArray) || jsonArray.length === 0) {
        callback();
        return;
      }

      const headers = Object.keys(jsonArray[0]).join(",");
      const rows = jsonArray
        .map((obj) => Object.values(obj).join(","))
        .join("\n");

      this.push(headers + "\n" + rows + "\n");

      callback();
    },
  });

  transformStream.header = "";
  transformStream.bufferedData = "";

  try {
    await pipeline(
      createReadStream(inputFile, { encoding: "utf-8" }),
      transformStream,
      createWriteStream(outputFile),
    );
  } catch (error) {
    console.log(error);
    throw new Error("Operation failed");
  }
};
