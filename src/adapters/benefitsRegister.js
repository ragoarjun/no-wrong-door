const { XMLParser } = require("fast-xml-parser");

const XML_BASE_URL = "http://localhost:8082";

const CACHE_TTL = 60 * 1000;

const FAILURE_THRESHOLD = 3;
const CIRCUIT_OPEN_TIME = 30 * 1000;

let cachedRecords = null;
let cacheTime = 0;

let consecutiveFailures = 0;
let circuitState = "CLOSED";
let circuitOpenedAt = 0;

async function getBenefitsRecords() {

    const now = Date.now();

    // 1. Return fresh cached data first
    if (cachedRecords && now - cacheTime < CACHE_TTL) {
        console.log("Benefits cache hit");
        return cachedRecords;
    }

    // 2. Check circuit breaker
    if (circuitState === "OPEN") {

        if (now - circuitOpenedAt < CIRCUIT_OPEN_TIME) {
            throw new Error("Benefits service temporarily unavailable");
        }

        console.log("Benefits circuit half-open");
        circuitState = "HALF-OPEN";
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

        // Successful request
        cachedRecords = records;
        cacheTime = Date.now();

        consecutiveFailures = 0;
        circuitState = "CLOSED";

        console.log("Benefits cache updated");
        console.log("Benefits circuit closed");

        return records;

    } catch (error) {

        consecutiveFailures++;

        console.log(
            `Benefits failure ${consecutiveFailures}/${FAILURE_THRESHOLD}`
        );

        if (consecutiveFailures >= FAILURE_THRESHOLD) {
            circuitState = "OPEN";
            circuitOpenedAt = Date.now();

            console.log("Benefits circuit opened");
        }

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