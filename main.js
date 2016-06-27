var baseurl = "https://api.aercloud.aeris.com/v1/1/scls/interntessel1/containers/tesselcontainer/contentInstances?apiKey=3965e581-120d-11e2-8fb3-6362753ec2a5&maxSize=";
var lastsize = 0;
var nextToken = 0;
var accelx = [];
var accely = [];
var accelz = [];

var size = $(window).width();
if (size > $(window).height())
    size = $(window).height();
document.querySelector("#visualxy").width = size - 35;
document.querySelector("#visualxy").height = size - 35;
refreshdata();

function refreshdata() {
    nextToken = 0;
    var url = "";
    accelx = [];
    accely = [];
    accelz = [];
    url = baseurl + "1";
    $.getJSON(url, function(data) {
        if (nextToken != undefined) {
            refreshdataB(data.nextToken);
        }
    });
}

function refreshdataB(nextToken) {
    console.log(nextToken);
    if (nextToken == undefined) {
        draw(accelx, accely, "xy", 20, 10, "#000000", 3);
        return;
    }
    url = baseurl + "1500&nextToken=" + nextToken;
    $.getJSON(url, function(data) {
        var count = data.contentInstances.length;
        for (var i = 0; i < count; i++) {
            if (data.contentInstances[i].content.contentTypeBinary != "") {
                accelx.unshift(jQuery.parseJSON(data.contentInstances[i].content.contentTypeBinary).x);
                accely.unshift(jQuery.parseJSON(data.contentInstances[i].content.contentTypeBinary).y);
                accelz.unshift(jQuery.parseJSON(data.contentInstances[i].content.contentTypeBinary).z);
            }
        }
        //draw(accelx, accelz, "xz", -1, 10, "#000000", 3);
        //draw(accely, accelz, "yz", -1, 10, "#000000", 3);
        refreshdataB(data.nextToken);
    });
}

function draw(dataA, dataB, plane, mult, speed, color, width) {
    var canvas = document.getElementById("visual" + plane);
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FF7519";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(plane + " plane", canvas.width / 2, 15);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = width;
    var count = 0;
    var dt = .05;
    var velA = 0;
    var velB = 0;
    var oldVelA = 0;
    var oldVelB = 0;
    var posA = canvas.width / 2;
    var posB = canvas.height / 2;
    // for(var count = 0; count < dataA.length; count++) {
    var recordingdrawing = setInterval(function() {
        var oldVelA = velA;
        var oldVelB = velB;
        velA = velA + mult * dataA[count] * dt;
        velB = velB + mult * dataB[count] * dt;
        ctx.beginPath();
        ctx.moveTo(posA, posB);
        posA = posA + (oldVelA + velA) * 0.5 * dt;
        posB = posB + (oldVelB + velB) * 0.5 * dt;
        ctx.lineTo(posA, posB);
        ctx.strokeStyle = color;
        ctx.stroke();
        count++;
        if (count > dataA.length || count > dataB.length) {
            window.clearInterval(recordingdrawing);
            refreshdata();
        }
    }, speed);
    //       if(count == (dataA.length - 1)) {
    //           //window.clearInterval(recordingdrawing);
    // 	//ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 	refreshdata();
    // }
    //   }
}