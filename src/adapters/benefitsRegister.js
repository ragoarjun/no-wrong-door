const { XMLParser } = require("fast-xml-parser");

const XML_BASE_URL = "http://localhost:8082";


async function getBenefitsRecords() {

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

        return data.BenefitsRegister.Record;
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