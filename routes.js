"use strict";

const axios = require("axios");
const csv=require('csvtojson');
const Enumerable = require("linq");

module.exports = async function(app){

    app.get('/evaluation', async (req, res) => {
        const urls = Object.values(req.query);
        const content = await getUrlContents(urls)
        let data = []

        for await (const el of content) {         
            if(el.status ==="fulfilled"){
                data = data.concat(await convertCsvToJson(el.value.data))
            }
        }

        if(data.length === 0) {
            res.status(500).send("No csv-files found")
        } else {
            res.send(JSON.stringify(evaluateJson(data)));
        }
    })
}

 async function getUrlContents(urls) {
    const requests = urls.map((url) => axios.get(url,{responseType: "blob"}));
    return await Promise.allSettled(requests);
}

async function convertCsvToJson(csvString){
    return await csv({
        noheader: false,
        output: "json"
    })
    .fromString(csvString)
    .then((jsonData)=>{ 
        return jsonData;
    })
}

function evaluateJson(jsonData){

    const mostSpeeches = Enumerable.from(jsonData)
        .where("new Date($.Date).getUTCFullYear() == 2013")
        .groupBy("$.Speaker", "$.Speaker",  (key, group)=>({"Speaker": key, length: group.count()}), (key)=>key.toString())
        .orderBy("$.length")
        .toJSONString();

    const mostSecurity = Enumerable.from(jsonData)
        .where("$.Topic == 'Internal Security'")
        .groupBy("$.Speaker", "$.Speaker",  (key, group)=>({"Speaker": key, length: group.count()}), (key)=>key.toString())
        .orderBy("$.length")
        .toJSONString();
   
    const leastWordy = Enumerable.from(jsonData)
        .groupBy("$.Speaker", "parseInt($.Words)",  (key, group)=>({"Speaker": key, length: group.sum()}), (key)=>key.toString())
        .orderBy("$.length")
        .toJSONString();

   return {
        mostSpeeches: JSON.parse(mostSpeeches).pop()?.Speaker || null,
        mostSecurity: JSON.parse(mostSecurity).pop()?.Speaker || null,
        leastWordy: JSON.parse(leastWordy)[0]?.Speaker || null,
     }


}