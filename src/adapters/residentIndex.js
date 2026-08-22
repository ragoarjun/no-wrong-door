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

        allResidents = allResidents.concat(data.results);

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