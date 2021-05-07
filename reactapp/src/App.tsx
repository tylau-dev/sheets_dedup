import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from './logo.svg';
import './App.css';
import Googlelogin from './component/Googlelogin';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';


function App() {
  const [buttonAPIVisibility, setButtonAPIVisibility] = useState<object>({ visibility: "visible" })
  const [dedupVisibility, setDedupVisibility] = useState<object>({ visibility: "hidden" })
  const [listSheetID, setListSheetID] = useState<Array<string>>([])
  const [accessToken, setAccessToken] = useState<string>('')
  const [selectSheet, setSelectSheet] = useState<string>('')
  const [resultMessage, setResultMessage] = useState<string>('')
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

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
    const result = await fetch('sheets', {
      method: "POST",
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `token=${accessToken}&sheet=${selectSheet}`
    })

    const fetchResultMessage = await result.json()
    setResultMessage(fetchResultMessage.toString())
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
