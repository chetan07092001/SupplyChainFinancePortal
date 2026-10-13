const LOG_SERVER = "http://localhost:9001/log";

export function logChatbot(label, payload) {
  if (process.env.NODE_ENV !== "development") return;
  fetch(LOG_SERVER, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ time: new Date().toISOString(), label, payload }),
  }).catch(() => {}); // silent — never break the UI
}
