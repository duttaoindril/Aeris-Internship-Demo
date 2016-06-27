var tessel = require('tessel');
var wifi = require('wifi-cc3000');
var https = require('https');
var accelLib = require('accel-mma84');
var climatelib = require('climate-si7020');
var gpsLib = require('gps-a2235h');

var climate = climatelib.use(tessel.port['A'])
    // var gps = gpsLib.use(tessel.port['C']);
var accel = accelLib.use(tessel.port['D']);

var netw = "IoT-Workshop";
var pass = "aeris123";
var started = [false, false, false];
var size = 60;
var dId = 1;
var draw = true;
var data = [];
var latitude = 0;
var longitude = 0;
var altitude = 0;
var temperature = 0;
var humidity = 0;

accel.on('ready', function() {
    connect(function() {
        // gps.powerOn(function() {
        //     startGPS();
        // });
        clear();
        startClimate();
        startAccel();
    });
});

tessel.button.on('press', function(time) {
    dId += 0.5;
    draw = !draw;
});

function connect(callback) {
    if (!wifi.isConnected()) {
        console.log("Trying to connect to " + netw);
        wifi.connect({
            ssid: netw,
            password: pass
        }, function() {
            if (!wifi.isConnected()) {
                connect();
            } else {
                callback();
            }
        });
    } else if (callback) {
        callback();
    }
}

function startAccel() {
    if (!started[0]) {
        console.log("Accel Started!");
        accel.on('data', function(xyz) {
            push(xyz);
        });
        started[0] = true;
    }
}

function startGPS() {
    if (!started[1]) {
        console.log("GPS Started!");
        gps.on('ready', function() {
            gps.on('coordinates', function(coords) {
                latitude = coords.lat;
                longitude = coords.lon;
            });
            gps.on('altitude', function(alt) {
                altitude = alt.alt;
            });
        });
        started[1] = true;
    }
}

function startClimate() {
    if (!started[2]) {
        console.log("Climate Started!");
        climate.on('ready', function() {
            climate.readHumidity(function(err, humid) {
                humidity = humid.toFixed(4);
            });
            climate.readTemperature('f', function(err, temp) {
                temperature = temp.toFixed(4);
            });
        });
        started[2] = true;
    }
}

function push(xyz) {
    if (draw) {
        var c = {
            id: dId,
            x: xyz[0],
            y: xyz[1],
            z: xyz[2],
            la: latitude,
            lo: longitude,
            a: altitude,
            t: temperature,
            h: humidity
        };
        // console.log(c);
        data.push(c);
    }

}

function send() {
    tSize = size;
    if (data.length < size)
        tSize = data.length;
    sendToAercloud(JSON.stringify(data.slice(0, tSize)));
    data = data.slice(tSize);
}

function sendToAercloud(posting) {
    console.log("Sending to AerCloud...");
    var req = https.request({
        port: 443,
        method: 'POST',
        hostname: 'api.aercloud.aeris.com',
        path: '/v1/1/scls/interntessel1/containers/tesselcontainer/contentInstances?apiKey=3965e581-120d-11e2-8fb3-6362753ec2a5',
        headers: {
            Host: 'api.aercloud.aeris.com',
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'User-Agent': 'tessel'
        }
    }, function(res) {
        console.log('statusCode: ', res.statusCode);
        send();
    });
    req.write(posting);
    req.end();
    req.on('error', function(e) {
        console.error("error posting data to your container", e);
        connect(function() {
            send();
        });
    });
}

function clear() {
    console.log("Clearing AerCloud Container tesselcontainer...");
    var req = https.request({
        port: 443,
        method: 'DELETE',
        hostname: 'api.aercloud.aeris.com',
        path: '/v1/1/scls/interntessel1/containers/tesselcontainer/contentInstances?apiKey=3965e581-120d-11e2-8fb3-6362753ec2a5',
        headers: {
            Host: 'api.aercloud.aeris.com',
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'User-Agent': 'tessel'
        }
    }, function(res) {
        console.log('statusCode: ', res.statusCode);
        send();
    });
    req.end();
    req.on('error', function(e) {
        console.error("Error Clearing Container tesselcontainer", e);
        connect(function() {
            clear();
        });
    });
}