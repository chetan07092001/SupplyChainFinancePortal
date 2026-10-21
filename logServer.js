// Dev-only log server — receives POST /log and appends to chatbot-debug.log
const http = require("http");
const fs = require("fs");
const path = require("path");

const LOG_FILE = path.join(__dirname, "chatbot-debug.log");
const PORT = 9001;

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/log") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const entry = JSON.parse(body);
        const line = `[${entry.time}] [${entry.label}]\n${JSON.stringify(entry.payload, null, 2)}\n${"─".repeat(80)}\n`;
        fs.appendFileSync(LOG_FILE, line, "utf8");
        res.writeHead(200);
        res.end("ok");
      } catch {
        res.writeHead(400);
        res.end("bad json");
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`[logServer] Writing chatbot logs → chatbot-debug.log  (port ${PORT})`);
});
