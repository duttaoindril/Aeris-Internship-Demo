var tessel = require('tessel');
var wifi = require('wifi-cc3000');
var https = require('https');
var accelLib = require('accel-mma84');
var gpsLib = require('gps-a2235h');
gpsLib.debug = 1;

var accel = accelLib.use(tessel.port['A']);
var gps = gpsLib.use(tessel.port['C']);

var cName = "tesselcontainer";

var latitude = 0;
var longitude = 0;
var altitude = 0;
var posting = [];
var i = 0;
var drawingid = 0;
var draw = false;
var started = false;

var netw = "soumiland";
var pass = "soumithriphone";

function connect(callback) {
	if(!wifi.isConnected()) {
		console.log("Trying to connect to " + netw);
		wifi.connect({ssid: netw, password: pass}, function () {
			if(!wifi.isConnected()) {
				connect();
			}
			else {
				startAccel();
			}
		});
	}
	else if(callback) {
		callback();
	}
}

accel.on('ready', function () {
	connect(function() {
		startAccel();
	});
});

function startAccel() {
	if(!started) {
		accel.on('data', function (xyz) {
			if(draw) {
				push(xyz[0], xyz[1], xyz[2], i);
				i++;    
			}
		});
		started = true;
		clear();
	}
}

function push(accelx, accely, accelz, i) {
    if(i < 70) {
       posting[i] = '{"Id":'+drawingid+',"ts":'+Date.now()+',"la":'+latitude+',"lo":'+longitude+',"ax":'+accelx+',"ay":'+accely+',"az":'+accelz+'}';
    }
    // if(i==5) {
 //        for(var j = 0; j < i; j++) {
 //            sendToAercloud(posting[i]);
 //        }
 //        posting = [];
 //    }
}

function send() {
    console.log(posting.length+' '+posting.toString());
    sendToAercloud("["+posting.toString()+"]");
    // posting = posting.slice(0, 70);
    posting = [];
    i = 0;
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
        console.error("error posting data to your container",e);
	connect();
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
        console.error("error posting data to your container",e);
    });
}

tessel.button.on('press', function(time) {
    drawingid++;
    draw = !draw;
});
