console.log("TEST FILE STARTED");

const { getBenefitsRecords } = require("../src/adapters/benefitsRegister");

async function test() {
    try {
        const records = await getBenefitsRecords();

        if (!Array.isArray(records)) {
            throw new Error("Benefits records are not an array");
        }

        if (records.length === 0) {
            throw new Error("No benefits records returned");
        }

        const firstRecord = records[0];

        if (!firstRecord.Ref) {
            throw new Error("Benefits record is missing Ref");
        }

        console.log("Total benefits records:", records.length);
        console.log("First record:", firstRecord);
        console.log("PASS: Benefits records loaded and parsed correctly");
    } catch (error) {
        console.error("FAIL:", error.message);
        process.exit(1);
    }
}

test();