var tessel = require('tessel');
var wifi = require('wifi-cc3000');
var https = require('https');
var accelLib = require('accel-mma84');
var climatelib = require('climate-si7020');
var climate = climatelib.use(tessel.port['A']);
//var gpsLib = require('gps-a2235h');
//var gps = gpsLib.use(tessel.port['C']);
var accel = accelLib.use(tessel.port['D']);
accel.setOutputRate(800);
accel.setScaleRange(2);

var netw = "soumiland";//"apphone";
var pass = "soumithriphone";//"Anuraaj123";
var started = [false, false, false];
var size = 61;
var dId = 4;
var draw = true;
var data = [];
// var latitude = 37.3871245;
// var longitude = -121.9668402;
var latitude = 37.4194449;
var longitude = -122.2097391;
var altitude = 0;
var temperature = 65;
var humidity = 31;

accel.on('ready', function() {
    connect(function() {;
        /*gps.powerOn(function() {
            startGPS();
        });*/
        //clear();
        //startClimate();
        startAccel();
        send();
    });
});

climate.on('ready', function() {
    console.log("Climate Ready!");
    setInterval(function() {
        climate.readHumidity(function(err, humid){
            climate.readTemperature('f', function(err, temp) {
                temperature = parseFloat(temp.toFixed(0));
                humidity = parseFloat(humid.toFixed(0));
                //console.log(temperature+'  : '+temp.toFixed(0)+' '+humidity+' : '+humid.toFixed(0));
            });
        });
    }, 1000);  
});

tessel.button.on('press', function(time) {
    dId += 0.5;
    draw = !draw;

    // if(dId==5){
    //     latitude = 37.4195378;
    //     longitude = -122.2098117;
    // }
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
        latitude += Math.floor(Math.random() * 0.0000712);
        longitude += Math.floor(Math.random() * 0.0000712);
        console.log("lat: "+latitude+"long: "+longitude);
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

// function startClimate() {
//     if (!started[2]) {
//         console.log("Climate Started!");
//         console.log("Climate YOOOO!");
//         climate.on('ready', function() {
//             console.log("Climate Ready!");
//             setInterval(function() {
//                 climate.readHumidity(function(err, humid){
//                     climate.readTemperature('f', function(err, temp) {
//                         temperature = temp;
//                         humidity = humid;
//                         console.log(temperature+'  : '+temp.toFixed(0)+' '+humidity+' : '+humid.toFixed(0));
//                     });
//                 });
//             }, 1000);  
//         });
//         started[2] = true;
//     }
// }

function push(xyz) {
    if (draw) {
        var c = {
            s: (Date.now()/1000).toFixed(0),
            i: dId,
            x: xyz[0].toFixed(6),
            y: xyz[1].toFixed(6),
            z: xyz[2].toFixed(6),
            b: randomize(latitude, 0.0001375, 6),
            c: randomize(longitude, 0.0001735, 6),
            t: randomize(temperature, 1.5, 1),
            h: randomize(humidity, 1.5, 1)
        };
        data.push(c);
    }
}

function randomize(num, range, fix) {
    return parseFloat((Math.random()*(range*2) + (num - range)).toFixed(fix));
}

function send() {
    var tSize = size;
    if (data.length < tSize)
        tSize = data.length;
    console.log(tSize);
    console.log("preSlice: "+data.length);
    sendToAercloud(JSON.stringify(data.slice(0, tSize)));
    data = data.slice(tSize);
    console.log("postSlice: "+data.length);
}

function sendToAercloud(posting) {
    console.log("Sending to AerCloud...");
    var req = https.request({
        port: 443,
        method: 'POST',
        hostname: 'api.aercloud.aeris.com',
        path: '/v1/1/scls/interntessel1/containers/Makena_Capital_Container/contentInstances?apiKey=3965e581-120d-11e2-8fb3-6362753ec2a5',
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


// function clear() {
//     console.log("Clearing AerCloud Container Makena_Capital_Container...");
//     var req = https.request({
//         port: 443,
//         method: 'DELETE',
//         hostname: 'api.aercloud.aeris.com',
//         path: '/v1/1/scls/interntessel1/containers/Makena_Capital_Container/contentInstances?apiKey=3965e581-120d-11e2-8fb3-6362753ec2a5',
//         headers: {
//             Host: 'api.aercloud.aeris.com',
//             'Accept': 'application/json, text/plain, */*',
//             'Content-Type': 'application/json',
//             'User-Agent': 'tessel'
//         }
//     }, function(res) {
//         console.log('statusCode: ', res.statusCode);
//         send();
//     });
//     req.end();
//     req.on('error', function(e) {
//         console.error("Error Clearing Container Makena_Capital_Container", e);
//         connect(function() {
//             clear();
//         });
//     });
// }