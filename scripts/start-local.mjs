import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline/promises";
import { promisify } from "node:util";

const run = promisify(execFile);
const DEFAULT_PORT = 5173;
const args = process.argv.slice(2);
const portIndex = args.indexOf("--port");
const noOpen = args.includes("--no-open");
const help = args.includes("--help") || args.includes("-h");

function configPath() {
  if (process.env.ESPANOL_LAUNCHER_CONFIG) return process.env.ESPANOL_LAUNCHER_CONFIG;
  if (process.platform === "win32") return join(process.env.APPDATA || join(homedir(), "AppData", "Roaming"), "Espanol Academy", "server.json");
  if (process.platform === "darwin") return join(homedir(), "Library", "Application Support", "Espanol Academy", "server.json");
  return join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "espanol-academy", "server.json");
}

function parsePort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Port must be a whole number from 1024 through 65535.");
  return port;
}

async function portIsAvailable(port) {
  return new Promise((resolveAvailable) => {
    const server = createServer();
    server.once("error", () => resolveAvailable(false));
    server.once("listening", () => server.close(() => resolveAvailable(true)));
    server.listen(port, "127.0.0.1");
  });
}

async function openBrowser(url) {
  const attempts = process.platform === "darwin"
    ? [["open", ["-a", "Firefox", url]], ["open", [url]]]
    : process.platform === "win32"
      ? [["cmd", ["/d", "/s", "/c", `start "" firefox "${url}"`]], ["cmd", ["/d", "/s", "/c", `start "" "${url}"`]]]
      : [["firefox", [url]], ["xdg-open", [url]]];
  for (const [command, commandArgs] of attempts) {
    try { await run(command, commandArgs); return; } catch { /* try the system browser */ }
  }
  console.warn(`Could not open a browser automatically. Open ${url}`);
}

if (help) {
  console.log("Usage: npm run start:local -- [--port 5180] [--no-open]");
  process.exit(0);
}

const settingsFile = configPath();
const saved = await readFile(settingsFile, "utf8").then(JSON.parse).catch(() => ({}));
let port;
if (portIndex >= 0) {
  if (!args[portIndex + 1]) throw new Error("--port requires a number.");
  port = parsePort(args[portIndex + 1]);
} else if (process.stdin.isTTY) {
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  const fallback = (() => { try { return parsePort(saved.port ?? DEFAULT_PORT); } catch { return DEFAULT_PORT; } })();
  const answer = await prompt.question(`Local server port [${fallback}]: `);
  prompt.close();
  port = answer.trim() ? parsePort(answer.trim()) : fallback;
} else {
  port = (() => { try { return parsePort(saved.port ?? DEFAULT_PORT); } catch { return DEFAULT_PORT; } })();
}

if (!await portIsAvailable(port)) throw new Error(`Port ${port} is already in use. Run again and choose another port.`);
await mkdir(dirname(settingsFile), { recursive: true });
await writeFile(settingsFile, `${JSON.stringify({ port }, null, 2)}\n`);

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const child = execFile(npm, ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(port), "--strictPort"]);
child.stdout?.pipe(process.stdout);
child.stderr?.pipe(process.stderr);
const url = `http://127.0.0.1:${port}/`;
let opened = false;
let startupOutput = "";
child.stdout?.on("data", (chunk) => {
  startupOutput += chunk.toString();
  if (!opened && startupOutput.includes("Local:")) {
    opened = true;
    console.log(`Local academy: ${url}`);
    if (!noOpen) void openBrowser(url);
  }
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code, signal) => process.exitCode = signal ? 1 : (code ?? 0));
