import os from "os";
import { startRepl } from "./repl.js";

console.log("Welcome to Data Processing CLI!");
const homeDir = os.homedir();
console.log(`You are currently in ${homeDir}`);

startRepl(homeDir);
