const { getUnifiedData } = require("../src/services/residentService");

async function test() {
    try {
        const data = await getUnifiedData();

        console.log("Overall:", data.status);
        console.log("Residents:", data.sources.residents);
        console.log("Benefits:", data.sources.benefits);

        if (!["complete", "partial", "failed"].includes(data.status)) {
            throw new Error("Invalid overall status");
        }

        if (!data.sources.residents || !data.sources.benefits) {
            throw new Error("Missing source status information");
        }

        if (data.status === "partial") {
            const oneSourceFailed =
                data.sources.residents.status === "failed" ||
                data.sources.benefits.status === "failed";

            if (!oneSourceFailed) {
                throw new Error("Partial response must contain a failed source");
            }
        }

        if (data.status === "failed") {
            if (
                data.sources.residents.status !== "failed" ||
                data.sources.benefits.status !== "failed"
            ) {
                throw new Error("Failed response must contain two failed sources");
            }
        }

        console.log("PASS: Unified service returned a valid degradation state");
    } catch (error) {
        console.error("FAIL:", error.message);
        process.exit(1);
    }
}

test();