# HCNetSDK Node.js application

This is a simple Node.js script for use the PTZ control of **Ezviz** and **Hikvision** cameras with the HCNetSDK.

### About
I use this application for PTZ control of my EZVIZ C6TC via the local network instead of the cloud. 

It used the linux64 libs from https://www.hikvision.com/en/support/tools/hitools/ (Device Network SDK) and because the SDK not support the architecture from my mac I use docker to run it locally with `--platform=linux/amd64`. If you environment runs on linux/64 then probably you can run it locally.

**Feel free to change the code, extend it with new features or add support for win32/64/linux32 etc. Pull requests are welcome**


### Run via docker

* Run the next command to create the docker image
```sh
docker build --tag hc_net_sdk_node_js .
```
* Next start the builder container with the command below
```sh
docker run -it -p 3123:3000 hc_net_sdk_node_js
```
* You can reach the application on http://localhost:3123
* Here is an example for control the ptz: http://localhost:3123/ptz-control/right?ip=192.168.1.12&port=8000&username=admin&password=test12&channel=1
* You can use `/ptz-control/up`, `/ptz-control/down`, `/ptz-control/left` and `/ptz-control/right`

### Run locally via npm/node (not tested)
* install node-gyp globally:
```sh
  npm install -g node-gyp
```

* install the node packages:
```sh
  npm install
```

* Start the node project
```sh
  node app.js
```
* You can reach the application on http://localhost:3000
* Here is an example for control the ptz: http://localhost:3000/ptz-control/right?ip=192.168.1.12&port=8000&username=admin&password=test12&channel=1
* You can use `/ptz-control/up`, `/ptz-control/down`, `/ptz-control/left` and `/ptz-control/right`
