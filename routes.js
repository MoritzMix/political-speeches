"use strict";

const axios = require("axios");
const csv = require('csvtojson');

module.exports = async function (app) {

    app.get('/evaluation', async (req, res) => {
        const urls = Object.values(req.query);
        const content = await getUrlContents(urls)
        let data = []

        for await (const el of content) {
            if (el.status === "fulfilled") {
                data = data.concat(await convertCsvToJson(el.value.data))
            }
        }

        if (data.length === 0) {
            res.status(500).send("No csv-files found")
        } else {
            res.send(JSON.stringify(evaluateJson(data)));
        }
    })
}

async function getUrlContents(urls) {
    const requests = urls.map((url) => axios.get(url, { responseType: "blob" }));
    return await Promise.allSettled(requests);
}

async function convertCsvToJson(csvString) {
    const jsonData = await csv({
        noheader: false,
        output: "json"
    })
        .fromString(csvString)
    return jsonData;
}

function evaluateJson(jsonData) {

    const Speakers = {};

    const evaluateDate = (speech) => {
        return speech.indexOf("2013") === 0 ? 1 : 0;
    };

    const evaluateTopic = (topic) => {
        return topic.toLowerCase() === "internal security" ? 1 : 0;
    };

    jsonData.forEach((el) => {
        const existingSpeaker = Speakers[el.Speaker];
        if (existingSpeaker) {
            Object.assign(existingSpeaker, {
                words: existingSpeaker.words + Number(el.Words),
                speeches: existingSpeaker.speeches + evaluateDate(el.Date),
                topic: existingSpeaker.topic + evaluateTopic(el.Topic),
            });

        } else {
            Speakers[el.Speaker] = {
                words: Number(el.Words),
                speeches: evaluateDate(el.Date),
                topic: evaluateTopic(el.Topic),
            };
        }
    });

    const result = {
        mostSpeeches: null,
        mostSecurity: null,
        leastWordy: null,
    };

    Object.entries(Speakers).forEach((speaker) => {
        if (
            speaker[1].speeches > 0 &&
            speaker[1].speeches >
            (result.mostSpeeches ? result.mostSecurity[1].speeches : 0)
        ) {
            result.mostSpeeches = speaker;
        }

        if (
            speaker[1].topic > 0 &&
            speaker[1].topic > (result.mostSecurity ? result.mostSecurity[1].topic : 0)
        ) {
            result.mostSecurity = speaker;
        }

        if (
            speaker[1].words > 0 &&
            speaker[1].words <
            (result.leastWordy ? result.leastWordy[1].words : Number.MAX_SAFE_INTEGER)

        ) {
            result.leastWordy = speaker;
        }

    });

    const returnNameifExisting = (speaker) => {
        return speaker ? speaker[0] : null;
    };

    return {
        mostSpeeches: returnNameifExisting(result.mostSpeeches),
        mostSecurity: returnNameifExisting(result.mostSecurity),
        leastWordy: returnNameifExisting(result.leastWordy),
    };
}