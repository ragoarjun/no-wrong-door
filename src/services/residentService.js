const { getAllResidents } = require("../adapters/residentIndex");
const { getBenefitsRecords } = require("../adapters/benefitsRegister");

async function getUnifiedData() {
    const results = await Promise.allSettled([
        getAllResidents(),
        getBenefitsRecords()
    ]);

    const residentsResult = results[0];
    const benefitsResult = results[1];

    const residentsSuccess = residentsResult.status === "fulfilled";
    const benefitsSuccess = benefitsResult.status === "fulfilled";

    let status;

    if (residentsSuccess && benefitsSuccess) {
        status = "complete";
    } else if (residentsSuccess || benefitsSuccess) {
        status = "partial";
    } else {
        status = "failed";
    }

    return {
        status,

        residents: residentsSuccess
            ? residentsResult.value
            : null,

        benefits: benefitsSuccess
            ? benefitsResult.value
            : null,

        sources: {
            residents: residentsSuccess
                ? { status: "success" }
                : {
                    status: "failed",
                    error: residentsResult.reason.message
                },

            benefits: benefitsSuccess
                ? { status: "success" }
                : {
                    status: "failed",
                    error: benefitsResult.reason.message
                }
        }
    };
}

module.exports = {
    getUnifiedData
};