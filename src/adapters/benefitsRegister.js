const { XMLParser } = require("fast-xml-parser");

const XML_BASE_URL = "http://localhost:8082";


async function getBenefitsRecords() {
    console.log("Calling XML service...");

    const response = await fetch(`${XML_BASE_URL}/records`);

    console.log("XML service responded:", response.status);

    if (!response.ok) {
        throw new Error(`Benefits service returned ${response.status}`);
    }

    const xml = await response.text();

    console.log("Received XML");

    const parser = new XMLParser();
    const data = parser.parse(xml);

    console.log("XML parsed");

    return data.BenefitsRegister.Record;
}

module.exports = {
    getBenefitsRecords
};