import { access, writeFile } from "node:fs/promises";

import { parseArgs } from "../utils/argParser.js";
import { resolvePath } from "../utils/pathResolver.js";
import { isValidAlgorithm } from "../utils/validators.js";
import { calculateFileHash } from "../utils/hashHelper.js";

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
    const finalHash = await calculateFileHash(inputFile, algorithm);

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
