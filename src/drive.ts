import express, {Router} from 'express';
import fetch from "node-fetch";


const driveRouter = Router()
// Route for consuming the Access Token and sending back the list of spreadsheet files of a given user
driveRouter.post("/drive", async (req, res, next) => {
    // Get request to retrieve the Google Drive Data
    const accessToken = req.body.token
    const driveData = await fetch(`https://www.googleapis.com/drive/v3/files`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    const driveDataJson = await driveData.json()
    const driveFiles = driveDataJson.files

    // Filter by mimeType to get only the Spreadsheet files
    const spreadSheetList = []
    for (const element of driveFiles) {
        if (element.mimeType === 'application/vnd.google-apps.spreadsheet') {
            spreadSheetList.push(element.id)
        }
    }
    // Spreadsheetlist sent back as a Response
    res.json(spreadSheetList);
});

export default driveRouter
