import express from "express";
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import path from 'path';
import fetch from "node-fetch";

dotenv.config()

const app = express();
const port = process.env.PORT; // default port to listen

app.use(express.static(path.join(__dirname, 'reactapp/build')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json({
    type: ['application/json', 'text/plain']
}))
app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.send();
});

// Default route handler
app.get("/", async (req, res) => {
    res.send("ok");
});

// Route for consuming the Access Token and sending back the list of spreadsheet files of a given user
app.post("/drive", async (req, res, next) => {

    const accessToken = req.body.token
    const driveData = await fetch(`https://www.googleapis.com/drive/v3/files`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    const driveDataJson = await driveData.json()

    const driveFiles = driveDataJson.files
    const spreadSheetList = []

    for (const element of driveFiles) {
        if (element.mimeType === 'application/vnd.google-apps.spreadsheet') {
            spreadSheetList.push(element.id)
        }
    }
    res.json(spreadSheetList);
});

// Route fetching data from a Worksheets and applying the deduplication logic
app.post("/sheets", async (req, res) => {
    try {
        console.log("test")
        const accessTokenBody = req.body.token
        const selectSheet = req.body.sheet

        const sheetsData = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${selectSheet}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessTokenBody}`
            }
        })
        const sheetsDataJSON = await sheetsData.json()

        // Gets Sheets_ID
        const gridID: string[] = []
        for (const sheetsProps of sheetsDataJSON.sheets) {
            if (sheetsProps.properties.title === "A") {
                gridID.splice(0, 0, sheetsProps.properties.sheetId)
            }
            else if (sheetsProps.properties.title === "B") {
                gridID.splice(1, 0, sheetsProps.properties.sheetId)
            }
        }

        if (gridID.length !== 2) {
            throw new Error('Incorrect number of sheets (missing named sheet "A" or "B"?)')
        }
        let gridDataA:string[]
        let gridDataB:string[]

        // Fetch each Sheet data
        for (const [index, sheetId] of gridID.entries()) {
            const gridBody = JSON.stringify({ "dataFilters": [{ "gridRange": { "sheetId": sheetId } }] })

            const gridData = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${selectSheet}/values:batchGetByDataFilter`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessTokenBody}`,
                },
                body: gridBody
            })
            const gridDataJSON = await gridData.json()
            if (index === 0) {
                gridDataA = gridDataJSON.valueRanges[0].valueRange.values
            }
            else {
                gridDataB = gridDataJSON.valueRanges[0].valueRange.values
            }
        }

        // Create new Sheet named "C"
        const newSheetBody = JSON.stringify({
            "requests": [
                {
                    "addSheet": {
                        "properties": {
                            "title": "C"
                        }
                    }
                }
            ]
        })
        const newSheet = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${selectSheet}:batchUpdate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessTokenBody}`,
            },
            body: newSheetBody
        })
        const newSheetJson = await newSheet.json()
        const newSheetId = newSheetJson.replies[0].addSheet.properties.sheetId

        // First row of GridData = Label + Separate it from the rest of the data set
        const labelA = gridDataA[0]
        gridDataA.shift()

        const labelB = gridDataB[0]
        gridDataB.shift()

        // Remap each Row of the Grids in objects in the format {label: value}
        const arrayObjectA = gridDataA.map((row: any) => {
            const newObj:any = {}
            row.forEach((element: any, index: number) => {
                let elementModif = element
                if (element === '') {
                    elementModif = null
                }
                const keyModif:string = labelA[index]
                newObj[keyModif] = elementModif
            })
            return newObj
        })

        const arrayObjectB = gridDataB.map((row: any) => {
            const newObj:any = {}
            row.forEach((element: string, index: number) => {
                let elementModif = element
                if (element === '') {
                    elementModif = null
                }
                const keyModif:string = labelB[index]
                newObj[keyModif] = elementModif
            })
            return newObj
        })

        // Merge the 2 dataset together
        const dedupArray = []
        for (const row of arrayObjectA) {

            // Find corresponding object in Grid B
            let matchObj:any = {}
            arrayObjectB.forEach((element:any) => {
                if (element.firstName === row.firstName && element.lastName === row.lastName && element.email === row.email) {
                    matchObj = element
                }
            })

            // Merge the 2 objects together
            const mergedObj:any = {}
            const keysObj1 = Object.keys(row)
            keysObj1.forEach(key1 => {
                mergedObj[key1] = row[key1] || matchObj[key1]
            })

            const keysObj2 = Object.keys(matchObj)
            keysObj2.forEach(key2 => {
                if (!keysObj1.includes(key2)) {
                    mergedObj[key2] = matchObj[key2]
                }
            })

            dedupArray.push(mergedObj)
        }

        // Reformat the data to match the required output
        const finalLabel = Array.from(new Set([...labelA, ...labelB]))

        const finalArray = dedupArray.map((element:any) => {
            return Object.values(element)
        })

        finalArray.unshift(finalLabel)
        const batchUpdateBodyJson = JSON.stringify({
            "valueInputOption": "RAW",
            "data": [
              {
                "dataFilter": {
                  "gridRange": {
                    "sheetId": newSheetId
                  }
                },
                "values": finalArray
              }
            ]
          })

        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${selectSheet}/values:batchUpdateByDataFilter`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessTokenBody}`,
            },
            body: batchUpdateBodyJson
        })

        res.json("ok");
    }
    catch (err) {
        res.json(err)
    }

});

// start the Express server
app.listen(port, () => {
    // tslint:disable-next-line:no-console
    console.log(`server started at http://localhost:${port}`);
});
