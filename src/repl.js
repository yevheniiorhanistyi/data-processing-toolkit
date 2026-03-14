import readline from "readline";
import { handleLs, handleCd, handleUp } from "./navigation.js";
import { csvToJson } from "./commands/csvToJson.js";
import { jsonToCsv } from "./commands/jsonToCsv.js";
import { count } from "./commands/count.js";
import { hash } from "./commands/hash.js";
import { hashCompare } from "./commands/hashCompare.js";
import { encrypt } from "./commands/encrypt.js";
import { decrypt } from "./commands/decrypt.js";
import { logStats } from "./commands/logStats.js";

export function startRepl(currentDir) {
  let cwd = currentDir;

  const commands = {
    ls: handleLs,
    cd: handleCd,
    up: handleUp,
    count: count,
    hash: hash,
    encrypt: encrypt,
    decrypt: decrypt,
    "csv-to-json": csvToJson,
    "json-to-csv": jsonToCsv,
    "hash-compare": hashCompare,
    "log-stats": logStats,
  };

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });

  rl.prompt();

  rl.on("line", async (line) => {
    const input = line.trim();

    if (!input) {
      rl.prompt();
      return;
    }

    const parts = input.split(/\s+/);

    const cmd = parts[0];
    const args = parts.slice(1);

    if (cmd === ".exit") {
      console.log("Thank you for using Data Processing CLI!");
      rl.close();
      return;
    }

    const command = commands[cmd];

    if (!command) {
      console.log("Invalid input");
      rl.prompt();
      return;
    }

    try {
      const newCwd = await command(cwd, args);
      if (newCwd) cwd = newCwd;

      console.log(`You are currently in ${cwd}`);
    } catch {
      console.log("Operation failed");
    }

    rl.prompt();
  });

  rl.on("SIGINT", () => {
    console.log("\nThank you for using Data Processing CLI!");
    rl.close();
  });

  rl.on("close", () => {
    process.exit(0);
  });
}
