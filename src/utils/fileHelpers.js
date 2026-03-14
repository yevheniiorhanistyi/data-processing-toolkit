export const findNewline = async (handle, position, fileSize) => {
  const buffer = Buffer.alloc(1);
  let currentPos = position;

  while (currentPos < fileSize) {
    await handle.read(buffer, 0, 1, currentPos);
    if (buffer[0] === 10) return currentPos;
    currentPos++;
  }

  return fileSize - 1;
};
