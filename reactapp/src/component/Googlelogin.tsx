import React from 'react'
import { GoogleLogin } from 'react-google-login'

function Googlelogin(props: any) {
    // Function handling a successful connexion 
    const onSuccess = async (res: any) => {
        // Retrieve the access_token
        const access_token = res.tokenObj.access_token

        // Send back the access token to the parent component
        props.saveAccessToken(access_token)

        // Send the access token to retrieve the list of google sheets ID
        const sendToken = await fetch("https://obscure-taiga-01883.herokuapp.com/drive", {
            mode: "no-cors",
            method: "POST",
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: `token=${access_token}`
        })

        const spreadSheetList = await sendToken.json()
        console.log(spreadSheetList)
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
                clientId="42021385954-ak083djj9438q5feilta4on1spgm1cuf.apps.googleusercontent.com"
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

export default Googlelogin