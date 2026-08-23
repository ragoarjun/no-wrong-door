const { getUnifiedData } = require("../src/services/residentService");

async function test() {
    const data = await getUnifiedData();

    console.log("Overall:", data.status);
    console.log("Residents:", data.sources.residents);
    console.log("Benefits:", data.sources.benefits);
}

test();