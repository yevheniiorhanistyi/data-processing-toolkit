import * as crypto from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { access } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";

import { parseArgs } from "../utils/argParser.js";
import { resolvePath } from "../utils/pathResolver.js";

export const encrypt = async (currentDir, args) => {
  const { input, output, password } = parseArgs(args);

  if (!input || !output || !password) {
    console.log("Invalid input");
    return;
  }

  const inputFile = resolvePath(currentDir, input);
  const outputFile = resolvePath(currentDir, output);

  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);

  const scrypt = promisify(crypto.scrypt);
  const key = await scrypt(password, salt, 32);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  try {
    await access(inputFile);
    const readStream = createReadStream(inputFile);
    const writeStream = createWriteStream(outputFile);

    await new Promise((resolve) => writeStream.write(salt, resolve));
    await new Promise((resolve) => writeStream.write(iv, resolve));
    await pipeline(readStream, cipher, writeStream, { end: false });

    writeStream.end(cipher.getAuthTag());
  } catch {
    throw new Error("Operation failed");
  }
};
