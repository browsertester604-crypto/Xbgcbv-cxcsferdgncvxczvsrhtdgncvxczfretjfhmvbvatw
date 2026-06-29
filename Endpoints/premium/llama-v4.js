import OpenAI from "openai";
import dotenv from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1"
});

async function webSearch(query) {
    try {

        const { data } = await axios.get(
            "https://html.duckduckgo.com/html/",
            {
                params: {
                    q: query
                },
                headers: {
                    "User-Agent": "Mozilla/5.0"
                }
            }
        );

        const $ = cheerio.load(data);

        const results = [];

        $(".result").each((i, el) => {

            if (i >= 5) return false;

            results.push({
                title: $(el).find(".result__title").text().trim(),
                url: $(el).find(".result__url").text().trim(),
                snippet: $(el).find(".result__snippet").text().trim()
            });

        });

        return results;

    } catch (err) {

        return [];

    }
}

export default async function(prompt) {

    const searchResults = await webSearch(prompt);

    const completion = await openai.chat.completions.create({

        model: "mistralai/mixtral-8x7b-instruct-v0.1",

        messages: [
            {
                role: "system",
                content: `You are a Llama a helpful AI Assistant that gives clear answers.
                Developer: Meta Platforms, Inc.
                Version: 4
                Release Date: April 5, 2025
                Official Website: https://llama.meta.com/
                Web Search Results:
                ${JSON.stringify(searchResults, null, 2)}`
            },
            {
                role: "user",
                content: prompt
            }
        ],

        temperature: 0.1,
        top_p: 0.7,
        max_tokens: 4096,
        stream: false

    });

    return completion.choices[0].message.content;

}