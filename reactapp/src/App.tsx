import React, { useState } from 'react';
import './App.css';
import Googlelogin from './component/Googlelogin';


function App() {
  const [buttonAPIVisibility, setButtonAPIVisibility] = useState<object>({ visibility: "visible" })
  const [dedupVisibility, setDedupVisibility] = useState<object>({ visibility: "hidden" })
  const [listSheetID, setListSheetID] = useState<Array<string>>([])
  const [accessToken, setAccessToken] = useState<string>('')
  const [selectSheet, setSelectSheet] = useState<string>('')
  const [resultMessage, setResultMessage] = useState<string>('')

  // Functions setting the states from the input retrieved from the Googlelogin child component
  const saveSheetID = (list: Array<string>) => {
    setListSheetID(list)
  }

  const saveAccessToken = (token: string) => {
    setAccessToken(token)
  }

  // function for showing parts of the component
  const hideButton = () => {
    setButtonAPIVisibility({ visibility: "hidden" })
    setDedupVisibility({ visibility: "visible" })
  }

  // Map of the list of sheets ID
  let sheetsIdMap = listSheetID.map((element, index) => {
    return (
      <button onClick={() => setSelectSheet(element)}>{element}</button>
    )
  })

  // Function sending the access token and the Sheet ID to the back
  const handleDeduplicate = async () => {
    const result = await fetch('https://obscure-taiga-01883.herokuapp.com/sheets', {
      mode: 'no-cors',
      method: "POST",
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `token=${accessToken}&sheet=${selectSheet}`
    })
    const fetchResultMessage = await result.json()
    console.log(fetchResultMessage)
    if (fetchResultMessage === "ok") {
      setResultMessage(fetchResultMessage.toString())
    }
    else {
      setResultMessage("Error while deduplicating the Sheeets (make sure that no Sheets named 'C' exists)")
    }    
  }

  return (
    <div className="App">
      <div style={buttonAPIVisibility}>
        <Googlelogin
          saveSheetID={saveSheetID}
          saveAccessToken={saveAccessToken}
          hideButton={hideButton}
        />
      </div>

      <div style={dedupVisibility}>
        <div>
          {sheetsIdMap}
        </div>

        <p>Selected Sheet: {selectSheet}</p>

        <div>
          <button onClick={() => handleDeduplicate()}>Deduplicate</button>
          <p>{resultMessage}</p>
        </div>
      </div>
    </div>
  );
}

export default App;
