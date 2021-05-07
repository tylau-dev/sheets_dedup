import express, {Router} from 'express';
import fetch from "node-fetch";


const sheetRouter = Router()

// Route fetching data from a Worksheets and applying the deduplication logic
sheetRouter.post("/sheets", async (req, res) => {
    try {
        // Retrieving the Access Token and the Selected Sheet from the Body of the request
        const accessTokenBody = req.body.token
        const selectSheet = req.body.sheet

        // Get request to retrieve the Sheets Data
        const sheetsData = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${selectSheet}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessTokenBody}`
            }
        })
        const sheetsDataJSON = await sheetsData.json()

        // Gets Sheets_ID (called GridID)
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

        // Fetch each Sheet/Grid Data
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

        // // Retrieve the newly created Sheet ID
        const newSheetId = newSheetJson.replies[0].addSheet.properties.sheetId

        // First row of GridData = Label + Separate it from the rest of the data set
        const labelA = gridDataA[0]
        gridDataA.shift()
        const labelB = gridDataB[0]
        gridDataB.shift()

        // Remap each Row of the Grid Data as an Array of Objects {label: value}
        const arrayObjectA = convertArrayToObject(gridDataA, labelA)
        const arrayObjectB = convertArrayToObject(gridDataB, labelB)
        // Merge the 2 dataset together
        const dedupArray = []

        for (const row of arrayObjectA) {
            // Find corresponding object in Grid B
            const matchObj:any = {}
            arrayObjectB.forEach((element:any) => {
                // if (element.firstName === row.firstName && element.lastName === row.lastName && element.email === row.email) {
                //     matchObj = element
                // }
            })
            // Merge the 2 Objects together
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
            // Store the result in the dedupArray variable
            dedupArray.push(mergedObj)
        }

        // Reformat the data to match the required output
        const finalLabel = Array.from(new Set([...labelA, ...labelB]))
        const finalArray = dedupArray.map((element:any) => {
            return Object.values(element)
        })
        finalArray.unshift(finalLabel)

        console.log(finalArray)

        // Body values for writing in the newly created Sheet
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

        // POST request to update the Sheet
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

// Function to convert Array in the {label: value} format
const convertArrayToObject = (array: any[], label: string[]) => {
    return array.map((row) => {
        const newObj:any = {}
        row.forEach((element: any, index: number) => {
            let elementModif = element
            if (element === '') {
                elementModif = null
            }
            const keyModif:string = label[index]
            newObj[keyModif] = elementModif
        })
        return newObj
    })
}

export default sheetRouter
