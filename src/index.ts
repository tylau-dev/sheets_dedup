import express from "express";
import dotenv from 'dotenv';
import {google} from 'googleapis';

import path from 'path';

dotenv.config()

const app = express();
const port = process.env.PORT; // default port to listen

app.use(express.static(path.join(__dirname, 'reactapp/build')));



// Default route handler
app.get( "/", async ( req, res ) => {
    // Create authentification
    const oauth2Client = new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
)

    const scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/spreadsheets.readonly"
    ]

    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes
    })

    const data = await fetch(url)
    const code = await data.json()

    const {tokens} = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens);

    // Create client instance for auth
    // const client = await auth.getClient()

    // Instance of Google Sheets API
    // const googleSheets = google.sheets({version: "v4", auth: client});
    // const spreadsheetId = "1hsvQ6NTxd9rvrJ9lGBdAKSgzQeC5hei3dnKELBEX5PI"

    // // Get metadata about spreadsheets
    // const metaData = await googleSheets.spreadsheets.get({
    //     auth,
    //     spreadsheetId,
    // })

    res.send(tokens);
} );



// start the Express server
app.listen( port, () => {
    // tslint:disable-next-line:no-console
    console.log( `server started at http://localhost:${ port }` );
} );
