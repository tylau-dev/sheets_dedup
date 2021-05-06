import express from "express";
import dotenv from 'dotenv';
import { google } from 'googleapis';
import readline from 'readline';
import fs from 'fs';
import bodyParser from 'body-parser';
import path from 'path';
import { OAuth2Client } from "google-auth-library";
import fetch from "node-fetch"

dotenv.config()

const app = express();
const port = process.env.PORT; // default port to listen
const client = new OAuth2Client(process.env.CLIENT_SECRET, process.env.CLIENT_ID)

app.use(express.static(path.join(__dirname, 'reactapp/build')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json({
    type: ['application/json', 'text/plain']
}))
app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Add other headers here
    res.setHeader('Access-Control-Allow-Methods', 'POST'); // Add other methods here
    res.send();
});



// If modifying these scopes, delete token.json.


// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json'

// // Default route handler
app.get("/", async (req, res) => {
    res.send("ok");
});

app.post("/auth", async (req, res, next) => {

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
    console.log(driveFiles)
    for (const element of driveFiles) {
        if (element.mimeType === 'application/vnd.google-apps.spreadsheet') {
            spreadSheetList.push(element.id)
        }
    }
    console.log(spreadSheetList)

    // const ticket = await client.verifyIdToken({
    //     idToken: req.body.token,
    //     audience: process.env.CLIENT_ID
    // })

    // console.log(ticket)
    // const drive = google.drive({version: 'v3', ticket})

    // const drive = google.drive({version:'v3'})
    // console.log(data)

    res.json(spreadSheetList);

});

// /**
//  * Create an OAuth2 client with the given credentials, and then execute the
//  * given callback function.
//  * @param {Object} credentials The authorization client credentials.
//  * @param {function} callback The callback to call with the authorized client.
//  */
// function authorize(credentials: { installed: { client_secret: any; client_id: any; redirect_uris: any; }; }, callback: (arg0: OAuth2Client) => void) {
//     const { client_secret, client_id, redirect_uris } = credentials.installed;
//     const oAuth2Client = new google.auth.OAuth2(
//         client_id, client_secret, redirect_uris[0]);

//     // Check if we have previously stored a token.
//     fs.readFile(TOKEN_PATH, (err, token) => {
//         if (err) return getNewToken(oAuth2Client, callback);
//         oAuth2Client.setCredentials(JSON.parse(token.toString()));
//         callback(oAuth2Client);
//     });
// }


// /*
//     Get and store new token after prompting for user authorization, and then
//     execute the given callback with the authorized OAuth2 client.
//     @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
//     @param {getEventsCallback} callback The callback for the authorized client.
//  */
// function getNewToken(oAuth2Client: OAuth2Client, callback: { (arg0: OAuth2Client): void; (arg0: any): void; }) {
//     const authUrl = oAuth2Client.generateAuthUrl({
//         access_type: 'offline',
//         scope: scopes,
//     });
//     console.log('Authorize this app by visiting this url:', authUrl);
//     const rl = readline.createInterface({
//         input: process.stdin,
//         output: process.stdout,
//     });
//     rl.question('Enter the code from that page here: ', (code) => {
//         rl.close();
//         oAuth2Client.getToken(code, (err: any, token: any) => {
//             if (err) return console.error('Error while trying to retrieve access token', err);
//             oAuth2Client.setCredentials(token);
//             // Store the token to disk for later program executions
//             fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
//                 if (err) return console.error(err);
//                 console.log('Token stored to', TOKEN_PATH);
//             });
//             callback(oAuth2Client);
//         });
//     });
// }


// // Prints the names and majors of students in a sample spreadsheet:

// function listMajors(auth: any) {
//     const sheets = google.sheets({ version: 'v4', auth });
//     sheets.spreadsheets.values.get({
//         spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
//         range: 'Class Data!A2:E',
//     }, (err: string, res: { data: any[]; }) => {
//         if (err) return console.log('The API returned an error: ' + err);
//         const rows = res.data.values;
//         if (rows.length) {
//             console.log('Name, Major:');
//             // Print columns A and E, which correspond to indices 0 and 4.
//             rows.map((row: any[]) => {
//                 console.log(`${row[0]}, ${row[4]}`);
//             });
//         } else {
//             console.log('No data found.');
//         }
//     });
// }

// start the Express server
app.listen(port, () => {
    // tslint:disable-next-line:no-console
    console.log(`server started at http://localhost:${port}`);
});


