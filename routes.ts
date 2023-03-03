"use strict";

const axios = require("axios");
const logic = require("./logic.ts")


module.exports = async function (app: any) {

    app.get('/evaluation', async (req: any, res: any) => {
        const urls: String[] = Object.values(req.query);
        const content = await getUrlContents(urls)
        let data: String[] = []

        for await (const el of content) {
            if (el.status === "fulfilled") {
                data = data.concat(await logic.convertCsvToJson(el.value.data))
            }
        }

        if (data.length === 0) {
            res.status(500).send("No csv-files found")
        } else {
            res.send(JSON.stringify(logic.evaluateJson(data)));
        }
    })
}

async function getUrlContents(urls: String[]) {
    const requests = urls.map((url) => axios.get(url, { responseType: "blob" }));
    return await Promise.allSettled(requests);
}
