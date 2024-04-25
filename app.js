const koffi = require('koffi');
const express = require('express');

const HCNetSDK = koffi.load('./lib/libhcnetsdk.so');
const HCNetSDKInit = HCNetSDK.func('NET_DVR_Init', 'bool', []);
const HCNetSDKLogin = HCNetSDK.func('NET_DVR_Login_V30', 'long', ['str', 'int', 'str', 'str']);
const HCNetSDKPTZControlOther = HCNetSDK.func('NET_DVR_PTZControl_Other', 'bool', ['long', 'long', 'uint', 'uint']);

const PTZ_UP = 21;
const PTZ_DOWN = 22;
const PTZ_LEFT = 23;
const PTZ_RIGHT = 24;

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

    const initResult = HCNetSDKInit()
    if(!initResult){
        res.status(500);
        return res.send({
            'success': false,
            'message': 'HCNetSDK.NET_DVR_Init failed',
        });
    }

    let userID = HCNetSDKLogin(
        deviceCredential.ip,
        deviceCredential.port,
        deviceCredential.username,
        deviceCredential.password,
    );

    if (userID === -1 || userID === 4294967295) {
        res.status(401);
        return res.send({
            'success': false,
            'message': 'HCNetSDK.NET_DVR_Login_V30 authentication failed, check credentials',
        });
    }

    const ptzControlResult = HCNetSDKPTZControlOther(userID, deviceCredential.channel, PTZ_DIRECTION, 0);
    if(ptzControlResult){
        setTimeout(function() {
            HCNetSDKPTZControlOther(userID, deviceCredential.channel, PTZ_DIRECTION, 1)
        }, 500);
    }
    res.send({ 'success': true });
})

app.listen(port, () => {
    console.log(`HCNetSDK app listening on port ${port}`);
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
        ip: query.ip,
        port: Number(query.port),
        channel: Number(query.channel),
        username: query.username,
        password: query.password,
    };

}
