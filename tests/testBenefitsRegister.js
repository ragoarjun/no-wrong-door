console.log("TEST FILE STARTED");

const { getBenefitsRecords } = require("../src/adapters/benefitsRegister");


getBenefitsRecords()
    .then((records) => {
        console.log("Total benefits records:", records.length);
        console.log("First record:", records[0]);
    })
    .catch((error) => {
        console.error("ERROR:", error);
    });