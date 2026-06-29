import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const keyPath = path.join(__dirname, "keys.json");
const keyFile = JSON.parse(fs.readFileSync(keyPath, "utf8"));

const freemiumKeys = keyFile.Freemium_KEYS
  .split(",")
  .map(x => x.trim());

const premiumKeys = keyFile.Premium_KEYS
  .split(",")
  .map(x => x.trim());

const endpointRoot = path.join(__dirname, "Endpoints");

function register(folder, type) {
  const dir = path.join(endpointRoot, folder);

  if (!fs.existsSync(dir)) return;

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".js")) continue;

    const filename = file.replace(".js", "");

    app.get(`/${filename}`, async (req, res) => {
      const { prompt, key } = req.query;

      if (!prompt)
        return res.json({
          status: "offline",
          error: "Missing prompt"
        });

      if (!key)
        return res.json({
          status: "offline",
          error: "Join to the Official Server for the Keys"
        });

      const valid =
        type === "freemium"
          ? freemiumKeys.includes(key)
          : premiumKeys.includes(key);

      if (!valid)
        return res.json({
          status: "offline",
          error: "Invalid API Key"
        });

      try {
        const endpoint = await import(
          `./Endpoints/${folder}/${file}`
        );

        const response = await endpoint.default(prompt);

        res.json({
          status: "online",
          response
        });
      } catch (err) {
        console.error(err);

        res.status(500).json({
          status: "offline",
          error: err.message
        });
      }
    });
  }
}

register("freemium", "freemium");
register("premium", "premium");

// DO NOT app.listen() on Vercel
export default app;
