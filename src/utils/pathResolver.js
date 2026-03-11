import path from "node:path";

export const resolvePath = (currentDir, targetPath) => {
  return path.resolve(currentDir, targetPath);
};
