
"use strict";

const csv = require('csvtojson');
const DATE = "2013";
const TOPIC = "internal security"

interface Speaker {
    speeches: number,
    topic: number,
    words: number
}

interface SpeakerObject {
    [key: string]: Speaker
}

interface Entry {
    Speaker: string,
    Topic: string,
    Date: string,
    Words: string
}

interface Result {
    mostSpeeches: (string | Speaker)[] | null,
    mostSecurity: (string | Speaker)[] | null,
    leastWordy: (string | Speaker)[] | null,
}




const convertCsvToJson = async function (csvString: string): Promise<Entry[]> {
    const jsonData = await csv({
        noheader: false,
        output: "json"
    })
        .fromString(csvString)
    return jsonData;
}

const evaluateJson = function (jsonData: Entry[]) {

    const Speakers: SpeakerObject = {};

    const evaluateDate = (speech: string) => {
        return speech.indexOf(DATE) === 0 ? 1 : 0;
    };

    const evaluateTopic = (topic: string) => {
        return topic.toLowerCase() === TOPIC ? 1 : 0;
    };

    jsonData.forEach((el: Entry) => {
        const existingSpeaker: Speaker = Speakers[el.Speaker];

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

    const result: Result = {
        mostSpeeches: null,
        mostSecurity: null,
        leastWordy: null,
    };

    Object.entries(Speakers as SpeakerObject).forEach((speaker: [string, Speaker]) => {
        if (
            speaker[1]?.speeches > 0 &&
            speaker[1]?.speeches >
            //@ts-expect-error: Couldn't solve
            (result.mostSpeeches ? result.mostSecurity[1]?.speeches : 0)
        ) {
            result.mostSpeeches = speaker;
        }

        if (
            speaker[1]?.topic > 0 &&
            //@ts-expect-error: Couldn't solve
            speaker[1]?.topic > (result.mostSecurity ? result.mostSecurity[1]?.topic : 0)
        ) {
            result.mostSecurity = speaker;
        }

        if (
            speaker[1]?.words > 0 &&
            speaker[1]?.words <
            //@ts-expect-error: Couldn't solve
            (result.leastWordy ? result.leastWordy[1]?.words : Number.MAX_SAFE_INTEGER)

        ) {
            result.leastWordy = speaker;
        }
    });

    const returnNameifExisting = (speaker: (string | Speaker)[] | null) => {
        return speaker ? speaker[0] : null;
    };

    return {
        mostSpeeches: returnNameifExisting(result.mostSpeeches),
        mostSecurity: returnNameifExisting(result.mostSecurity),
        leastWordy: returnNameifExisting(result.leastWordy),
    };
}

module.exports = {
    convertCsvToJson,
    evaluateJson
}