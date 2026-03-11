import * as fs from "node:fs/promises";
import * as path from "node:path";

import { resolvePath } from "./utils/pathResolver.js";

export const handleLs = async (currentDir) => {
  const items = await fs.readdir(currentDir);

  const results = await Promise.all(
    items.map(async (item) => {
      const itemPath = path.join(currentDir, item);

      try {
        const stats = await fs.stat(itemPath);
        return {
          Name: item,
          Type: stats.isDirectory() ? "folder" : "file",
        };
      } catch {
        return null;
      }
    }),
  );

  const sortedResults = results.filter(Boolean).sort((a, b) => {
    if (a.Type === b.Type) {
      return a.Name.localeCompare(b.Name);
    }
    return a.Type === "folder" ? -1 : 1;
  });

  console.table(sortedResults);
};

export const handleCd = async (currentDir, args) => {
  if (args.length === 0) {
    console.log("Invalid input");
    return;
  }
  const targetDir = args.join(" ");
  const newPath = resolvePath(currentDir, targetDir);

  try {
    const stat = await fs.stat(newPath);

    if (stat.isDirectory()) {
      return newPath;
    } else {
      throw new Error("Operation failed");
    }
  } catch {
    throw new Error("Operation failed");
  }
};

export const handleUp = async (currentDir) => {
  if (currentDir === path.dirname(currentDir)) {
    return;
  }
  return path.dirname(currentDir);
};
