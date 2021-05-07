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
const express_1 = require("express");
const node_fetch_1 = __importDefault(require("node-fetch"));
const driveRouter = express_1.Router();
// Route for consuming the Access Token and sending back the list of spreadsheet files of a given user
driveRouter.post("/drive", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Get request to retrieve the Google Drive Data
    const accessToken = req.body.token;
    const driveData = yield node_fetch_1.default(`https://www.googleapis.com/drive/v3/files`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    const driveDataJson = yield driveData.json();
    const driveFiles = driveDataJson.files;
    // Filter by mimeType to get only the Spreadsheet files
    const spreadSheetList = [];
    for (const element of driveFiles) {
        if (element.mimeType === 'application/vnd.google-apps.spreadsheet') {
            spreadSheetList.push(element.id);
        }
    }
    // Spreadsheetlist sent back as a Response
    res.json(spreadSheetList);
}));
exports.default = driveRouter;
//# sourceMappingURL=drive.js.map