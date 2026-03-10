import readline from "readline";

export function startRepl(currentDir) {
  let cwd = currentDir;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });

  rl.prompt();

  rl.on("line", (line) => {
    const command = line.trim();

    if (command === ".exit") {
      console.log("Thank you for using Data Processing CLI!");
      rl.close();
      return;
    }

    console.log("Command received:", command);
    rl.prompt();
  });

  process.on("SIGINT", () => {
    console.log("\nThank you for using Data Processing CLI!");
    rl.close();
  });

  rl.on("close", () => {
    process.exit(0);
  });
}
