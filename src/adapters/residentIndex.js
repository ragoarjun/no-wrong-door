const REST_BASE_URL = "http://localhost:8081";

async function getResidentsPage(page) {
    const response = await fetch(
        `${REST_BASE_URL}/residents?page=${page}`
    );

    const data = await response.json();

    return data;
}

async function getAllResidents() {
    let page = 1;
    let allResidents = [];

    while (true) {
        const data = await getResidentsPage(page);

        for (const resident of data.results) {
            if (!allResidents.some(item => item.id === resident.id)) {
                allResidents.push(resident);
            }
        }

        if (!data.has_more) {
            break;
        }

        page++;
    }

    return allResidents;
}

module.exports = {
    getResidentsPage,
    getAllResidents
};