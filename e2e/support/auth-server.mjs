import { createServer } from "node:http";
import { session, token, user } from "./session.mjs";

createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3100");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "authorization, apikey, content-type, x-client-info, x-supabase-api-version",
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.setHeader("Content-Type", "application/json");
  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }
  let body = "";
  for await (const chunk of req) body += chunk;
  const path = new URL(req.url, "http://127.0.0.1:54329").pathname;
  if (path === "/health") {
    res.end("{}");
    return;
  }
  if (path === "/auth/v1/token") {
    const data = JSON.parse(body || "{}");
    if (
      (data.email === user.email && data.password === "password123") ||
      data.refresh_token === session.refresh_token
    ) {
      res.end(JSON.stringify(session));
      return;
    }
  }
  if (path === "/auth/v1/signup") {
    res.end(JSON.stringify(user));
    return;
  }
  if (path === "/auth/v1/recover") {
    res.end("{}");
    return;
  }
  if (req.headers.authorization === "Bearer " + token) {
    if (path === "/auth/v1/user") {
      res.end(JSON.stringify(user));
      return;
    }
    if (path === "/auth/v1/logout") {
      res.writeHead(204).end();
      return;
    }
  }
  res
    .writeHead(401)
    .end(JSON.stringify({ message: "Invalid credentials", code: "invalid_credentials" }));
}).listen(54329, "127.0.0.1");
