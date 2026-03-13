import { access, readFile } from "node:fs/promises";

import { parseArgs } from "../utils/argParser.js";
import { resolvePath } from "../utils/pathResolver.js";
import { isValidAlgorithm } from "../utils/validators.js";
import { calculateFileHash } from "../utils/hashHelper.js";

export const hashCompare = async (currentDir, args) => {
  const { input, hash, algorithm = "sha256" } = parseArgs(args);

  if (!input || !hash) {
    console.log("Invalid input");
    return;
  }

  if (!isValidAlgorithm(algorithm)) {
    throw new Error("Operation failed");
  }

  const inputFile = resolvePath(currentDir, input);
  const hashFile = resolvePath(currentDir, hash);

  try {
    await Promise.all([access(inputFile), access(hashFile)]);

    const [finalHash, rawStoredHash] = await Promise.all([
      calculateFileHash(inputFile, algorithm),
      readFile(hashFile, "utf-8"),
    ]);

    const storedHash = rawStoredHash.trim().toLowerCase();
    const calculatedHash = finalHash.toLowerCase();

    console.log(storedHash === calculatedHash ? "OK" : "MISMATCH");
  } catch {
    throw new Error("Operation failed");
  }
};
