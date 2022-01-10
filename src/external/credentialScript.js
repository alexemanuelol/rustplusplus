#!/usr/bin/env node

const axios = require('axios');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { register } = require('push-receiver');
const ChromeLauncher = require('chrome-launcher');
const path = require('path');


var expoPushToken = null;
var rustplusAuthToken = null;
let server;


async function getExpoPushToken(credentials) {
    const response = await axios.post('https://exp.host/--/api/v2/push/getExpoPushToken', {
        deviceId: uuidv4(),
        experienceId: '@facepunch/RustCompanion',
        appId: 'com.facepunch.rust.companion',
        deviceToken: credentials.fcm.token,
        type: 'fcm',
        development: false
    });

    return response.data.data.expoPushToken;
}

async function registerWithRustPlus(authToken, expoPushToken) {
    return axios.post('https://companion-rust.facepunch.com:443/api/push/register', {
        AuthToken: authToken,
        DeviceId: 'rustplus.js',
        PushKind: 0,
        PushToken: expoPushToken,
    })
}

async function linkSteamWithRustPlus() {
    return new Promise((resolve, reject) => {
        const app = express();

        /* Register pair web page */
        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname + '/pair.html'));
        });

        /* Register callback */
        app.get('/callback', async (req, res) => {
            /* We no longer need the Google Chrome instance */
            await ChromeLauncher.killAll();

            /* Get token from callback */
            const authToken = req.query.token;
            if (authToken) {
                res.send('Steam Account successfully linked with rustplus.js, you can now close this window and go back to the console.');
                resolve(authToken)
            }
            else {
                res.status(400).send('Token missing from request!');
                reject(new Error('Token missing from request!'))
            }

            /* We no longer need the express web server */
            server.close()
        });

        /* Start the express server before Google Chrome is launched. If the port is updated, make
           sure to also update it in pair.html */
        const port = 3000;
        server = app.listen(port, async () => {
            await ChromeLauncher.launch({
                startingUrl: `http://localhost:${port}`,
                chromeFlags: [
                    '--disable-web-security', /* Allows us to manipulate rust+ window */
                    '--disable-popup-blocking', /* Allows us to open rust+ login from our main window */
                    '--disable-site-isolation-trials', /* Required for --disable-web-security to work */
                    '--user-data-dir=/tmp/temporary-chrome-profile-dir-rustplus', /* Create a new chrome profile for pair.js */
                ],
                handleSIGINT: false, /* Handled manually in shutdown */
            }).catch((error) => {
                console.log(error);
                console.log("credentialScript.js failed to launch Google Chrome. Do you have it installed?");
                process.exit(1);
            });
        });
    });
}

async function run() {
    console.log('Registering with FCM');
    const fcmCredentials = await register('976529667804'); /* The fuck is this number? */
    console.log('Successfully registered with FCM');

    console.log('Fetching Expo Push Token');
    expoPushToken = await getExpoPushToken(fcmCredentials).catch((error) => {
        console.log('Failed to fetch Expo Push Token');
        console.log(error);
        process.exit(1);
    });
    console.log('Successfully fetched Expo Push Token');

    console.log('Google Chrome is launching so you can link your Steam Account with Rust+');
    rustplusAuthToken = await linkSteamWithRustPlus();
    console.log('Successfully linked Steam account with Rust+');

    console.log('Registering with Rust Companion API');
    await registerWithRustPlus(rustplusAuthToken, expoPushToken).catch((error) => {
        console.log('Failed to register with Rust Companion API');
        console.log(error);
        process.exit(1);
    });
    console.log("Successfully registered with Rust Companion API.");

    console.log('\n\nCopy the following Slash Command to your Discord Server Text Channel:\n\n');

    console.log('/credentials set ' +
        `keys_private_key: ${fcmCredentials.keys.privateKey} ` +
        `keys_public_key: ${fcmCredentials.keys.publicKey} ` +
        `keys_auth_secret: ${fcmCredentials.keys.authSecret} ` +
        `fcm_token: ${fcmCredentials.fcm.token} ` +
        `fcm_push_set: ${fcmCredentials.fcm.pushSet} ` +
        `gcm_token: ${fcmCredentials.gcm.token} ` +
        `gcm_android_id: ${fcmCredentials.gcm.androidId} ` +
        `gcm_security_token: ${fcmCredentials.gcm.securityToken} ` +
        `gcm_app_id: ${fcmCredentials.gcm.appId} `);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

async function shutdown() {
    /* Close chrome instances launched by credentialScript.js */
    await ChromeLauncher.killAll();

    /* Close express server */
    if (server) {
        server.close()
    }
}

run();