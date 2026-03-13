import { createReadStream } from "node:fs";
import { access, writeFile } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import * as crypto from "node:crypto";

import { parseArgs } from "../utils/argParser.js";
import { resolvePath } from "../utils/pathResolver.js";
import { isValidAlgorithm } from "../utils/validators.js";

export const hash = async (currentDir, args) => {
  const { input, algorithm = "sha256", save } = parseArgs(args);

  if (!input) {
    console.log("Invalid input");
    return;
  }

  if (!isValidAlgorithm(algorithm)) {
    throw new Error("Operation failed");
  }

  const inputFile = resolvePath(currentDir, input);

  try {
    await access(inputFile);
    const hashGenerator = crypto.createHash(algorithm);

    await pipeline(createReadStream(inputFile), hashGenerator);
    const finalHash = hashGenerator.digest("hex");

    console.log(`${algorithm}: ${finalHash}`);

    if (save) {
      await writeFile(`${inputFile}.${algorithm}`, finalHash, {
        encoding: "utf-8",
      });
    }
  } catch (error) {
    throw new Error("Operation failed");
  }
};
