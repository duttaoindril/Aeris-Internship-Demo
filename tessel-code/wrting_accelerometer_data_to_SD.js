// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/

/*********************************************
This basic accelerometer example logs a stream
of x, y, and z data from the accelerometer
*********************************************/

var tessel = require('tessel');
var sdcardlib = require('sdcard');

var sdcard = sdcardlib.use(tessel.port['D']);
var accel = require('accel-mma84').use(tessel.port['A']);

// Initialize the accelerometer.
accel.on('ready', function () {
    // Stream accelerometer data
  accel.on('data', function (xyz) {
	  
	  
	
	  
	  
	  
	 var pp = ['x:', xyz[0].toFixed(2),
      'y:', xyz[1].toFixed(2),
      'z:', xyz[2].toFixed(2)]; 
	  
	  
	sdcard.on('ready', function() {
    sdcard.getFilesystems(function(err, fss) {
    var fs = fss[0];
    console.log('Writing...');
    fs.writeFile('someSDFile.txt',pp.toString() , function(err) {
      console.log('Write complete. Reading...');
      fs.readFile('someFile.txt', function(err, data) {
        console.log('Read:\n', data.toString());
      });
    });
  });
});
	  
	  
	  
    //console.log(pp);
  });

});

accel.on('error', function(err){
  console.log('Error:', err);
});



