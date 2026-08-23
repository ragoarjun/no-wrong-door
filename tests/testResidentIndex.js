const { getAllResidents } = require("../src/adapters/residentIndex");

async function test() {
    try {
        const residents = await getAllResidents();

        const ids = residents.map(resident => resident.id);
        const uniqueIds = new Set(ids);

        console.log("Total residents:", residents.length);
        console.log("Unique IDs:", uniqueIds.size);

        if (ids.length !== uniqueIds.size) {
            throw new Error("Duplicate resident IDs found");
        }

        console.log("PASS: All resident IDs are unique");
    } catch (error) {
        console.error("FAIL:", error);
        process.exit(1);
    }
}

test();