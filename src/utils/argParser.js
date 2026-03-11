export const parseArgs = (args) => {
  const parsedArgs = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--") && args[i + 1] && !args[i + 1].startsWith("--")) {
      const key = arg.slice(2);
      const value = args[i + 1];
      parsedArgs[key] = value;
      i++;
    } else if (arg.startsWith("--")) {
      const key = arg.slice(2);
      parsedArgs[key] = true;
    }
  }
  return parsedArgs;
};
