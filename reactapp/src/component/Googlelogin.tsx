import React from 'react'
import { GoogleLogin } from 'react-google-login'
import {clientID} from '../statics/id'

function Googlelogin(props: any) {

    // Function handling a successful connexion 
    const onSuccess = async (res: any) => {
        // Retrieve the access_token
        const access_token = res.tokenObj.access_token

        // Send back the access token to the parent component
        props.saveAccessToken(access_token)

        // Send the access token to retrieve the list of google sheets ID
        const sendToken = await fetch("drive", {
            method: "POST",
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: `token=${access_token}`
        })

        const spreadSheetList = await sendToken.json()
        // Send back the list of sheets ID to parent component
        props.saveSheetID(spreadSheetList)
        props.hideButton()
        
        console.log('[Login Succsss] currentUser:', res)
    }

    // Function handling connexion failure
    const onFailure = (res: any) => {
        console.log('[Login Failed] res', res)
    }

    return (
            <GoogleLogin
                clientId={clientID}
                render={renderProps => (
                    <button onClick={renderProps.onClick} disabled={renderProps.disabled}>Connect API</button>
                )}
                buttonText="Login"
                onSuccess={onSuccess}
                onFailure={onFailure}
                cookiePolicy={'single_host_origin'}
                scope="https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/spreadsheets"
            />
    )
}
const scope = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.appdata"

export default Googlelogin