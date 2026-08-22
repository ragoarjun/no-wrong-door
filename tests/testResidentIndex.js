const { getAllResidents } = require("../src/adapters/residentIndex");

async function test() {
    const residents = await getAllResidents();

    const ids = residents.map(resident => resident.id);
    const uniqueIds = new Set(ids);

    console.log("Total residents:", residents.length);
    console.log("Unique IDs:", uniqueIds.size);
    console.log("All IDs unique:", ids.length === uniqueIds.size);
}

test();