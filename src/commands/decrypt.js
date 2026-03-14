import * as crypto from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { open, stat } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";

import { parseArgs } from "../utils/argParser.js";
import { resolvePath } from "../utils/pathResolver.js";

export const decrypt = async (currentDir, args) => {
  const { input, output, password } = parseArgs(args);

  if (!input || !output || !password) {
    console.log("Invalid input");
    return;
  }

  const inputFile = resolvePath(currentDir, input);
  const outputFile = resolvePath(currentDir, output);

  try {
    const stats = await stat(inputFile);
    const fileSize = stats.size;

    const fileHandle = await open(inputFile, "r");
    const salt = Buffer.alloc(16);
    const iv = Buffer.alloc(12);
    const authTag = Buffer.alloc(16);

    await fileHandle.read(salt, 0, 16, 0);
    await fileHandle.read(iv, 0, 12, 16);
    await fileHandle.read(authTag, 0, 16, fileSize - 16);

    const scrypt = promisify(crypto.scrypt);
    const key = await scrypt(password, salt, 32);

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    await fileHandle.close();

    const readStream = createReadStream(inputFile, {
      start: 28,
      end: fileSize - 16 - 1,
    });

    const writeStream = createWriteStream(outputFile);

    await pipeline(readStream, decipher, writeStream);
  } catch {
    throw new Error("Operation failed");
  }
};
