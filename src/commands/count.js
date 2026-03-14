import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

import { parseArgs } from "../utils/argParser.js";
import { resolvePath } from "../utils/pathResolver.js";

export const count = async (currentDir, args) => {
  const { input } = parseArgs(args);

  if (!input) {
    console.log("Invalid input");
    return;
  }

  const inputFile = resolvePath(currentDir, input);

  try {
    await access(inputFile);
  } catch (error) {
    throw new Error("Operation failed");
  }

  let wordCount = 0;
  let lineCount = 0;
  let charCount = 0;
  let wasLastCharWhitespace = true;
  let lastChar = "";

  const transformStream = new Transform({
    transform(chunk, _, callback) {
      const text = chunk.toString();
      charCount += [...text].length;

      for (const char of text) {
        if (char === "\n") {
          lineCount++;
        }

        const isWhitespace = /\s/.test(char);
        if (!isWhitespace && wasLastCharWhitespace) {
          wordCount++;
        }
        wasLastCharWhitespace = isWhitespace;
        lastChar = char;
      }
      callback();
    },
    flush(callback) {
      if (charCount > 0 && lastChar !== "\n") {
        lineCount++;
      }

      console.log(`Lines: ${lineCount}`);
      console.log(`Words: ${wordCount}`);
      console.log(`Characters: ${charCount}`);
      callback();
    },
  });

  try {
    await pipeline(
      createReadStream(inputFile, { encoding: "utf-8" }),
      transformStream,
    );
  } catch {
    throw new Error("Operation failed");
  }
};
