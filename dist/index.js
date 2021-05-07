"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const path_1 = __importDefault(require("path"));
const google_auth_library_1 = require("google-auth-library");
const node_fetch_1 = __importDefault(require("node-fetch"));
dotenv_1.default.config();
const app = express_1.default();
const port = process.env.PORT; // default port to listen
const oauthClient = new google_auth_library_1.OAuth2Client(process.env.CLIENT_ID, process.env.CLIENT_SECRET);
app.use(express_1.default.static(path_1.default.join(__dirname, 'reactapp/build')));
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(express_1.default.json({
    type: ['application/json', 'text/plain']
}));
app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.send();
});
// Default route handler
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send("ok");
}));
// Route for consuming the Access Token and sending back the list of spreadsheet files of a given user
app.post("/drive", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const accessToken = req.body.token;
    const driveData = yield node_fetch_1.default(`https://www.googleapis.com/drive/v3/files`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    const driveDataJson = yield driveData.json();
    const driveFiles = driveDataJson.files;
    const spreadSheetList = [];
    for (const element of driveFiles) {
        if (element.mimeType === 'application/vnd.google-apps.spreadsheet') {
            spreadSheetList.push(element.id);
        }
    }
    res.json(spreadSheetList);
}));
// Route fetching data from a Worksheets and applying the deduplication logic
// WIP
app.post("/sheets", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("test");
        const accessTokenBody = req.body.token;
        const selectSheet = req.body.sheet;
        const sheetsData = yield node_fetch_1.default(`https://sheets.googleapis.com/v4/spreadsheets/${selectSheet}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessTokenBody}`
            }
        });
        const sheetsDataJSON = yield sheetsData.json();
        // Gets Sheets_ID
        const gridID = [];
        for (const sheetsProps of sheetsDataJSON.sheets) {
            if (sheetsProps.properties.title === "A") {
                gridID.splice(0, 0, sheetsProps.properties.sheetId);
            }
            else if (sheetsProps.properties.title === "B") {
                gridID.splice(1, 0, sheetsProps.properties.sheetId);
            }
        }
        if (gridID.length !== 2) {
            throw new Error('Incorrect number of sheets (missing named sheet "A" or "B"?)');
        }
        let gridDataA;
        let gridDataB;
        // Fetch each Sheet data
        for (const [index, sheetId] of gridID.entries()) {
            const gridBody = JSON.stringify({ "dataFilters": [{ "gridRange": { "sheetId": sheetId } }] });
            const gridData = yield node_fetch_1.default(`https://sheets.googleapis.com/v4/spreadsheets/${selectSheet}/values:batchGetByDataFilter`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessTokenBody}`,
                },
                body: gridBody
            });
            const gridDataJSON = yield gridData.json();
            if (index === 0) {
                gridDataA = gridDataJSON.valueRanges[0].valueRange.values;
            }
            else {
                gridDataB = gridDataJSON.valueRanges[0].valueRange.values;
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
        });
        const newSheet = yield node_fetch_1.default(`https://sheets.googleapis.com/v4/spreadsheets/${selectSheet}:batchUpdate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessTokenBody}`,
            },
            body: newSheetBody
        });
        const newSheetJson = yield newSheet.json();
        const newSheetId = newSheetJson.replies[0].addSheet.properties.sheetId;
        // First row of GridData = Label + Separate it from the rest of the data set
        const labelA = gridDataA[0];
        gridDataA.shift();
        const labelB = gridDataB[0];
        gridDataB.shift();
        // Remap each Row of the Grids in objects in the format {label: value}
        const arrayObjectA = gridDataA.map((row) => {
            const newObj = {};
            row.forEach((element, index) => {
                let elementModif = element;
                if (element === '') {
                    elementModif = null;
                }
                const keyModif = labelA[index];
                newObj[keyModif] = elementModif;
            });
            return newObj;
        });
        const arrayObjectB = gridDataB.map((row) => {
            const newObj = {};
            row.forEach((element, index) => {
                let elementModif = element;
                if (element === '') {
                    elementModif = null;
                }
                const keyModif = labelB[index];
                newObj[keyModif] = elementModif;
            });
            return newObj;
        });
        // Merge the 2 dataset together
        const dedupArray = [];
        for (const row of arrayObjectA) {
            // Find corresponding object in Grid B
            let matchObj = {};
            arrayObjectB.forEach((element) => {
                if (element.firstName === row.firstName && element.lastName === row.lastName && element.email === row.email) {
                    matchObj = element;
                }
            });
            // Merge the 2 objects together
            const mergedObj = {};
            const keysObj1 = Object.keys(row);
            keysObj1.forEach(key1 => {
                mergedObj[key1] = row[key1] || matchObj[key1];
            });
            const keysObj2 = Object.keys(matchObj);
            keysObj2.forEach(key2 => {
                if (!keysObj1.includes(key2)) {
                    mergedObj[key2] = matchObj[key2];
                }
            });
            dedupArray.push(mergedObj);
        }
        // Reformat the data to match the required output
        const finalLabel = Array.from(new Set([...labelA, ...labelB]));
        const finalArray = dedupArray.map((element) => {
            return Object.values(element);
        });
        finalArray.unshift(finalLabel);
        console.log(finalArray);
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
        });
        yield node_fetch_1.default(`https://sheets.googleapis.com/v4/spreadsheets/${selectSheet}/values:batchUpdateByDataFilter`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessTokenBody}`,
            },
            body: batchUpdateBodyJson
        });
        res.json("ok");
    }
    catch (err) {
        res.json(err);
    }
}));
// start the Express server
app.listen(port, () => {
    // tslint:disable-next-line:no-console
    console.log(`server started at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map