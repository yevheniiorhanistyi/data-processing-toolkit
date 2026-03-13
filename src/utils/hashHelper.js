import { createReadStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import * as crypto from "node:crypto";

export const calculateFileHash = async (filePath, algorithm) => {
  const hashGenerator = crypto.createHash(algorithm);
  await pipeline(createReadStream(filePath), hashGenerator);
  return hashGenerator.digest("hex");
};
