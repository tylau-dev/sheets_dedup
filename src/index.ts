import express from "express";
import dotenv from 'dotenv';
import { google } from 'googleapis';
import readline from 'readline';
import fs from 'fs';
import bodyParser from 'body-parser';
import path from 'path';
import { OAuth2Client } from "google-auth-library";
import fetch from "node-fetch";
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { Console } from "console";

dotenv.config()

const app = express();
const port = process.env.PORT; // default port to listen
const oauthClient = new OAuth2Client(process.env.CLIENT_ID, process.env.CLIENT_SECRET)

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
// WIP
app.post("/sheets", async (req, res, next) => {
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
        let gridDataA
        let gridDataB
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
        console.log(gridDataA)
        console.log(gridDataB)

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
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${selectSheet}:batchUpdate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessTokenBody}`,
            },
            body: newSheetBody
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
