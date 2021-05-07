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

        // Use GoogleSpreadsheet API connexion to manage the changes on Google Sheet
        // Spreadsheets needs to be available in Public
        // const doc = new GoogleSpreadsheet(selectSheet);
        // await doc.useApiKey(process.env.API_KEY);
        // await doc.loadInfo()
        // console.log(doc)
        // await doc.updateProperties({ title: 'renamed doc' });


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
