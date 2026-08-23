const { XMLParser } = require("fast-xml-parser");

const XML_BASE_URL = "http://localhost:8082";

const CACHE_TTL = 60 * 1000;

let cachedRecords = null;
let cacheTime = 0;

async function getBenefitsRecords() {

    const now = Date.now();

    if (cachedRecords && now - cacheTime < CACHE_TTL) {
        console.log("Benefits cache hit");
        return cachedRecords;
    }

    console.log("Benefits cache miss - calling XML service...");

    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, 3000);

    try {
        const response = await fetch(`${XML_BASE_URL}/records`, {
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`Benefits service returned ${response.status}`);
        }

        const xml = await response.text();

        const parser = new XMLParser();
        const data = parser.parse(xml);

        const records = data.BenefitsRegister.Record;

        cachedRecords = records;
        cacheTime = Date.now();

        console.log("Benefits cache updated");

        return records;
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error("Benefits service timed out");
        }

        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

module.exports = {
    getBenefitsRecords
};