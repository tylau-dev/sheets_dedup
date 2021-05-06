import { access } from 'fs'
import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { GoogleLogin } from 'react-google-login'
import { Redirect } from 'react-router-dom'

interface SignupValues {
    email: string,
    password: string,
    confirmPassword: string,
    name: string,
}


function Googlelogin() {

    const onSuccess = async (res: any) => {
        console.log(res)
        var token_id = res.tokenObj.id_token
        console.log(token_id)

        const access_token = res.tokenObj.access_token
        console.log(access_token)

        // const data = await fetch(`https://www.googleapis.com/auth/drive.appdata?access_token=${access_token}`)
        // console.log(data)
        const sendToken = await fetch("auth", {
            method: "POST",
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: `token=${access_token}`
        })


        // console.log(sendToken)

        console.log('[Login Succsss] currentUser:', res)
    }

    const onFailure = (res: any) => {
        console.log('[Login Failed] res', res)
    }

    return (
        <>
            <GoogleLogin
                clientId="42021385954-ak083djj9438q5feilta4on1spgm1cuf.apps.googleusercontent.com"
                render={renderProps => (
                    <button onClick={renderProps.onClick} disabled={renderProps.disabled}>This is my custom Google button</button>
                )}
                buttonText="Login"
                onSuccess={onSuccess}
                onFailure={onFailure}
                cookiePolicy={'single_host_origin'}
                scope="https://www.googleapis.com/drive/v3/files"
            />
        </>
    )
}
const scope = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.appdata"

export default Googlelogin