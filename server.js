import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const keyFile = JSON.parse(fs.readFileSync("./keys.json"));

const freemiumKeys = keyFile.Freemium_KEYS
    .split(",")
    .map(x => x.trim());

const premiumKeys = keyFile.Premium_KEYS
    .split(",")
    .map(x => x.trim());

const endpointRoot = "./Endpoints";

function register(folder, type) {

    const dir = path.join(endpointRoot, folder);

    if (!fs.existsSync(dir))
        return;

    for (const file of fs.readdirSync(dir)) {

        if (!file.endsWith(".js"))
            continue;

        const filename = file.replace(".js", "");

        app.get(`/${filename}`, async (req, res) => {

            const prompt = req.query.prompt;
            const key = req.query.key;

            if (!prompt)
                return res.json({
                    status: "offline",
                    error: "Missing prompt"
                });

            if (!key)
                return res.json({
                    status: "offline",
                    error: "Missing key"
                });

            const valid = type == "freemium"
                ? freemiumKeys.includes(key)
                : premiumKeys.includes(key);

            if (!valid)
                return res.json({
                    status: "offline",
                    error: "Invalid API Key"
                });

            try {

                const endpoint = await import(`./Endpoints/${folder}/${file}`);

                const response = await endpoint.default(prompt);

                res.json({
                    status: "online",
                    response
                });

            } catch (err) {

                res.json({
                    status: "offline",
                    error: err.message
                });

            }

        });

    }

}

register("freemium", "freemium");
register("premium", "premium");

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});