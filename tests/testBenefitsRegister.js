console.log("TEST FILE STARTED");

const { getBenefitsRecords } = require("../src/adapters/benefitsRegister");

async function test() {
    try {
        console.log("First request:");

        const firstRecords = await getBenefitsRecords();

        if (!Array.isArray(firstRecords) || firstRecords.length === 0) {
            throw new Error("First request returned invalid data");
        }

        console.log("First request records:", firstRecords.length);

        console.log("\nSecond request:");

        const secondRecords = await getBenefitsRecords();

        if (!Array.isArray(secondRecords) || secondRecords.length === 0) {
            throw new Error("Second request returned invalid data");
        }

        if (firstRecords.length !== secondRecords.length) {
            throw new Error("Cached data does not match first response");
        }

        console.log("Second request records:", secondRecords.length);
        console.log("PASS: Cache returned data successfully");
    } catch (error) {
        console.error("FAIL:", error.message);
        process.exit(1);
    }
}

test();