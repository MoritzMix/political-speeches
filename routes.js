"use strict";

const axios = require("axios");
const csv=require('csvtojson');
const Enumerable = require("linq");

module.exports = async function(app){

    app.get('/', (req, res) => {
        res.send('Hello World!')
    })

    app.get('/evaluation', async (req, res) => {
        const urls = Object.values(req.query);
        //const urls =  ["http://localhost:4000/url1/test.csv","fail","http://localhost:4000/url2/test2.csv","http://localhost:4000/url3/test3.csv"];
        const content = await getURLContents(urls)
        let data = []

        for await (const el of content) {         
            if(el.status ==="fulfilled"){
                data = data.concat(await convertCSVToJSON(el.value.data))
            }
        }

        if(data.length === 0) {
            res.status(500).send("No csv-files found")
        } else {
            res.send(JSON.stringify(queryJson(data)));
        }
    })
}

//http://localhost:4000/evaluation?url1=http://localhost:4000/url3/test3.csv

 async function getURLContents(urls) {
    const requests = urls.map((url) => axios.get(url,{responseType: "blob"}));
    return await Promise.allSettled(requests);
}

async function convertCSVToJSON(csvString){
    return await csv({
        noheader: false,
        output: "json"
    })
    .fromString(csvString)
    .then((jsonData)=>{ 
        return jsonData;
    })
}

function queryJson(jsonData){

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