const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { URL } = require("node:url");

const CLIENT_ROOT = path.resolve(__dirname, "..", "Client");
const DATA_FILE = path.join(__dirname, "vehicles.json");
const UPLOADS_ROOT = path.join(__dirname, "uploads");
const PORT = Number(process.env.PORT || 3000);
const MAX_BODY = 10 * 1024 * 1024;
const contentTypes = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8" };

fs.mkdirSync(UPLOADS_ROOT, { recursive: true });

function readVehicles() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeVehicles(vehicles) {
  const temporaryFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temporaryFile, `${JSON.stringify(vehicles, null, 2)}\n`);
  fs.renameSync(temporaryFile, DATA_FILE);
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      size += Buffer.byteLength(chunk);
      if (size > MAX_BODY) {
        reject(new Error("El cuerpo de la solicitud excede el límite permitido."));
        request.destroy();
        return;
      }
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function validateVehicle(input) {
  const vehicle = {
    make: String(input.make || "").trim(),
    model: String(input.model || "").trim(),
    year: Number(input.year),
    mileage: Number(input.mileage || 0),
    price_usd: Number(input.price_usd),
    status: input.status,
    condition: String(input.condition || "Operativo").trim(),
    description: String(input.description || "").trim(),
    photo_url: input.photo_url ? String(input.photo_url).trim() : null,
  };
  if (!vehicle.make || !vehicle.model || !Number.isInteger(vehicle.year) ||
      vehicle.year < 1886 || vehicle.year > 2100 ||
      !Number.isInteger(vehicle.mileage) || vehicle.mileage < 0 ||
      !Number.isInteger(vehicle.price_usd) || vehicle.price_usd < 0 ||
      !["available", "workshop", "sold"].includes(vehicle.status)) {
    throw new Error("Datos de vehículo inválidos.");
  }
  return vehicle;
}

function serveStatic(response, pathname) {
  const requested = pathname === "/" ? "/page/index.html" : pathname;
  const filePath = path.resolve(CLIENT_ROOT, `.${requested}`);
  if (!filePath.startsWith(CLIENT_ROOT) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    sendJson(response, 404, { error: "Recurso no encontrado." });
    return;
  }
  response.writeHead(200, { "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (request.method === "OPTIONS") {
    response.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
    response.end();
    return;
  }
  try {
    if (url.pathname === "/api/vehicles" && request.method === "GET") {
      const status = url.searchParams.get("status");
      const vehicles = readVehicles().filter((vehicle) => !status || vehicle.status === status);
      sendJson(response, 200, { data: vehicles });
      return;
    }
    if (url.pathname === "/api/vehicles" && request.method === "POST") {
      const vehicle = validateVehicle(JSON.parse(await readBody(request)));
      const now = new Date().toISOString();
      const saved = { id: crypto.randomUUID(), ...vehicle, created_at: now, updated_at: now };
      const vehicles = readVehicles();
      vehicles.push(saved);
      writeVehicles(vehicles);
      sendJson(response, 201, saved);
      return;
    }
    if (url.pathname === "/api/photos" && request.method === "POST") {
      const input = JSON.parse(await readBody(request));
      const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(String(input.data || ""));
      if (!match) throw new Error("La foto debe ser JPEG, PNG o WebP en formato data URL.");
      const extension = match[1].split("/")[1].replace("jpeg", "jpg");
      const filename = `${crypto.randomUUID()}.${extension}`;
      fs.writeFileSync(path.join(UPLOADS_ROOT, filename), Buffer.from(match[2], "base64"));
      sendJson(response, 201, { url: `/uploads/${filename}` });
      return;
    }
    if (url.pathname.startsWith("/uploads/")) {
      const filePath = path.resolve(UPLOADS_ROOT, `.${url.pathname.slice("/uploads".length)}`);
      if (!filePath.startsWith(UPLOADS_ROOT) || !fs.existsSync(filePath)) {
        sendJson(response, 404, { error: "Foto no encontrada." });
        return;
      }
      response.writeHead(200);
      fs.createReadStream(filePath).pipe(response);
      return;
    }
    serveStatic(response, url.pathname);
  } catch (error) {
    sendJson(response, 400, { error: error.message });
  }
});

server.listen(PORT, () => console.log(`Pacheco API disponible en http://localhost:${PORT}`));
