const ffi = require('ffi-napi');
const ref = require('ref-napi');

const HCNetSDK = ffi.Library('./lib/libhcnetsdk', {
    'NET_DVR_Init': ['bool', []],
    'NET_DVR_Cleanup': ['bool', []],
    'NET_DVR_Login_V30': ['long', ['pointer', 'long', 'pointer', 'pointer', 'pointer']],
    'NET_DVR_Logout': ['bool', ['long']],
    'NET_DVR_PTZControl': ['bool', ['long', 'uint', 'uint']],
    'NET_DVR_PTZControl_Other': ['bool', ['long', 'long', 'uint', 'uint']],
    'NET_DVR_GetLastError': ['int', []],
    // Add other required functions here
});

const NET_DVR_DEVICEINFO_V30 = ref.types.void;
const PTZ_UP = 21;
const PTZ_DOWN = 22;
const PTZ_LEFT = 23;
const PTZ_RIGHT = 24;

const deviceInfo = ref.alloc(NET_DVR_DEVICEINFO_V30);

const express = require('express');
const app = express();
app.use(express.json());
const port = 3000;

app.get('/', (req, res) => {
    res.send({ 'app': 'HCNetSDK - nodejs', 'version': 'v1.0.0' });
});

app.get('/ptz-control/:direction', async (req, res) => {
    const paramDirection = req.params.direction;
    let PTZ_DIRECTION = -1;
    switch (paramDirection) {
        case 'up':
            PTZ_DIRECTION = PTZ_UP;
            break;
        case 'down':
            PTZ_DIRECTION = PTZ_DOWN;
            break;
        case 'left':
            PTZ_DIRECTION = PTZ_LEFT;
            break;
        case 'right':
            PTZ_DIRECTION = PTZ_RIGHT;
            break;
        default:
            res.status(400);
            return res.send({
                'success': false,
                'message': 'path "/ptz-control/:direction" direction is wrong. Use "up", "down", "left" or "right"',
            });
    }

    const deviceCredential = getDeviceCredential(req.query);
    if(deviceCredential === false){
        res.status(400);
        return res.send({
            'success': false,
            'message': 'missing query parameter of "/ptz-control/:direction" request. The next query parameter need to be set "ip", "port", "username", "password", "channel"',
        });
    }

    try {
        await HCNetSDK.NET_DVR_Init();
    } catch (e) {
        console.log('NET_DVR_Init failed, error code:', e);
    }

    let userID = -1;
    try {
        userID = await HCNetSDK.NET_DVR_Login_V30(
            deviceCredential.ip,
            deviceCredential.port,
            deviceCredential.username,
            deviceCredential.password,
            deviceInfo,
        );
    } catch (e) {
        console.log('NET_DVR_Login_V30 failed, error code:', e);
    }

    if (userID === -1 || userID === 4294967295) {
        res.status(401);
        return res.send({
            'success': false,
            'message': 'HCNetSDK.NET_DVR_Login_V30 authentication failed, check credentials',
        });
    }

    try {
        await HCNetSDK.NET_DVR_PTZControl_Other(userID, deviceCredential.channel, PTZ_DIRECTION, 0);
    } catch (e) {
        console.log('NET_DVR_PTZControl_Other failed, error code:', e);
    }
    setTimeout(function() {
        if (!HCNetSDK.NET_DVR_PTZControl_Other(userID, deviceCredential.channel, PTZ_DIRECTION, 1)) {
            console.log('Stop command failed, error code:', HCNetSDK.NET_DVR_GetLastError());
        }
    }, 500);
    res.send({ 'success': true });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

function getDeviceCredential(query) {
    if (query.ip === undefined ||
        query.port === undefined ||
        query.channel === undefined ||
        query.username === undefined ||
        query.password === undefined
    ) {
        return false;
    }
    return {
        ip: Buffer.from(query.ip + '\0', 'ascii'),
        port: Number(query.port),
        channel: Number(query.channel),
        username: Buffer.from(query.username + '\0', 'ascii'),
        password: Buffer.from(query.password + '\0', 'ascii'),
    };

}