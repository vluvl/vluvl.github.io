"use strict";

/*!
 * jQuery UI Touch Punch 0.2.3
 *
 * Copyright 2011-2014, Dave Furfero
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Depends:
 *  jquery.ui.widget.js
 *  jquery.ui.mouse.js
 * Handle touch input, for example from phones
 */
!function (a) {
    function f(a, b) {
        if (!(a.originalEvent.touches.length > 1)) {
            a.preventDefault();
            var c = a.originalEvent.changedTouches[0], d = document.createEvent("MouseEvents");
            d.initMouseEvent(b, !0, !0, window, 1, c.screenX, c.screenY, c.clientX, c.clientY, !1, !1, !1, !1, 0, null), a.target.dispatchEvent(d)
        }
    }

    if (a.support.touch = "ontouchend" in document, a.support.touch) {
        var e, b = a.ui.mouse.prototype, c = b._mouseInit, d = b._mouseDestroy;
        b._touchStart = function (a) {
            var b = this;
            !e && b._mouseCapture(a.originalEvent.changedTouches[0]) && (e = !0, b._touchMoved = !1, f(a, "mouseover"), f(a, "mousemove"), f(a, "mousedown"))
        }, b._touchMove = function (a) {
            e && (this._touchMoved = !0, f(a, "mousemove"))
        }, b._touchEnd = function (a) {
            e && (f(a, "mouseup"), f(a, "mouseout"), this._touchMoved || f(a, "click"), e = !1)
        }, b._mouseInit = function () {
            var b = this;
            b.element.bind({
                touchstart: a.proxy(b, "_touchStart"),
                touchmove: a.proxy(b, "_touchMove"),
                touchend: a.proxy(b, "_touchEnd")
            }), c.call(b)
        }, b._mouseDestroy = function () {
            var b = this;
            b.element.unbind({
                touchstart: a.proxy(b, "_touchStart"),
                touchmove: a.proxy(b, "_touchMove"),
                touchend: a.proxy(b, "_touchEnd")
            }), d.call(b)
        }
    }
}(jQuery);


var srcImg, r, g, b, iw, ih, blurBuf;
var PESTArray = [];
var PESTStop = 2;

function initPEST(id, cur_val, stepSize, color) {
    var newPESTRun = {};
    newPESTRun.id = id;
    newPESTRun.value = cur_val;
    newPESTRun.valueHistory = [];
    newPESTRun.step = stepSize;
    newPESTRun.color = color;
    newPESTRun.trial = 0;
    newPESTRun.trialPerRun = [];
    newPESTRun.correctTrial = 0;
    newPESTRun.accuracy = 0.70; // too many correct answers needed for a value change
    newPESTRun.constantW = 1;
    newPESTRun.directionStreak = 0;
    newPESTRun.stepChange = 1;
    newPESTRun.run = 0;
    newPESTRun.status = 0; // 0 = ongoing; 1 = finished
    return newPESTRun;
}

var currentIndex = 0;

var images = [];
for (let i = 0; i < 4; i++) {
    images.push(`testImages/${i}image.jpg`)
}
var ABColor = ['red', 'red', 'blue', 'blue']
var ABValue = [60, 45, 30, 70]
for (let i = 0; i < images.length; i++) {
    PESTArray.push(initPEST(i, ABValue[i] , 20, ABColor[i]));

}
var presets = [
    [[0, 0], [0, 0], [0, 0], false, [0, 0, 0]] //no aberration
];  // LoCA curve minima (RGB), linked, LaCA values (RGB)

var cw = $('#chart').width();
var ch = $('#chart').height();
var xOrigin, yOrigin, xLeftBase;
var rgb = {'red': '#ff0000', 'green': '#00ff00', 'blue': '#0000ff'};
var colours = ['red', 'green', 'blue'];
var curveCanv, raysCanv;
var pts = [];
var zPt = cw;  // index of pts midpoint; thus there are zPts * 2 + 1 pts

// inputs
var focus = 0;
var xy = {'red': [0, 0], 'green': [0, 0], 'blue': [0, 0]};
var lat = {'red': 0, 'green': 0, 'blue': 0};
var latLinked;

for (var i = 0; i <= zPt * 2; i++) {
    var x = i - zPt;
    pts[i] = Math.pow(Math.pow(x / 5.623419, 8), 1 / 5);  // pts[zPt/2] = ch
}

srcImg = new Image();
$(document).ready(function () {
    $(srcImg).one('load', function () {
        $('fieldset').height(Math.max.apply(Math, $('fieldset').map(function () {
            return $(this).height();
        }).get()));
        xOrigin = ($('#chart').width() - $('#redCurve img').width()) / 2;
        xLeftBase = xOrigin + $('#redCurve img').width() / 2;
        yOrigin = ch - $('#redCurve img').height();
        $('#chart img').css({'left': xOrigin, 'top': yOrigin});
        blurBuf = window.getComputedStyle(document.body).getPropertyValue('--blurBuf');
        blurBuf = parseInt(blurBuf);
        $("#redCurve").draggable({
            drag: function (event, ui) {
                curveDrag(ui)
            }
        });
        $("#greenCurve").draggable({
            drag: function (event, ui) {
                curveDrag(ui)
            }
        });
        $("#blueCurve").draggable({
            drag: function (event, ui) {
                curveDrag(ui)
            }
        });
        changeColor($('#buttons button').first(), 'red');
        if (!isNaN(blurBuf)) {  // test for ie11/edge
            curveCanv = canvFromID('curves', $('#chart').width(), $('#chart').height());
            raysCanv = canvFromID('rays', curveCanv.w, curveCanv.h);
            loadRGB();
            readUi();
            loadPreset(0);  // calls refreshImage, refreshChart
        }
    });
    $(srcImg).attr('src', `./testImages/${currentIndex}image.jpg`);
});

/////////////////////////////  V  ///////////////////////////


function changeImage() {
    currentIndex = (currentIndex + 1) % images.length;
    var completed = 0;
    while(PESTArray[currentIndex].status === 1){
        currentIndex = (currentIndex + 1) % images.length;
        completed++;
        if (completed === images.length){
            break;
        }
    }
    if(completed === images.length){
        // experiment done! All pest runs are finished
        window.location.href = "end.html";
    }
    renderImage();
    console.log(currentIndex +' - Run: ' + PESTArray[currentIndex].run + '; Trial no. ' + PESTArray[currentIndex].trial + ' with ' +
        PESTArray[currentIndex].correctTrial + ' CTs has value: ' + PESTArray[currentIndex].value + ' and a step size: ' +
        PESTArray[currentIndex].step + ' with stepChenge: ' + PESTArray[currentIndex].stepChange + ' streak: ' + PESTArray[currentIndex].directionStreak);

}

function PESTRatio() {
    return PESTArray[currentIndex].trial * PESTArray[currentIndex].accuracy;
}

function decideNextValue(direction) {
    var newValue;
    //limit the step size
    if (PESTArray[currentIndex].step > 40){
        PESTArray[currentIndex].step = 40;
    }
    // the value of chromatic aberration can go into negative, so we need to adjust our step direction accordingly
    if (PESTArray[currentIndex].value >= 0) {
        newValue = PESTArray[currentIndex].value + PESTArray[currentIndex].step * direction;
    } else {
        newValue = PESTArray[currentIndex].value - PESTArray[currentIndex].step * direction;
    }
    // clamp the new value between -150 and 150
    if (newValue > 100)
        newValue = 100;
    if (newValue < -100)
        newValue = -100;
    return newValue;
}

function PESTDecision(detectBlur) {
    PESTArray[currentIndex].trial += 1; // add a trial to the count
    if (detectBlur > 0) {
        PESTArray[currentIndex].correctTrial += 1; //if the answer is that blur is still being seen, then count as correct trial
    }
    // pest factors
    var constantW = PESTArray[currentIndex].constantW;
    var ratio = PESTRatio();

    var imgValue = PESTArray[currentIndex].value;
    // Note: right and wrong answers mean that the participant can or cannot see Chromatic Aberration respectively
    // So when a participant answers with a right answer, it means that they see Chromatic Aberration
    if (PESTArray[currentIndex].correctTrial <= ratio - constantW) { // too many wrong answers
        if (PESTArray[currentIndex].directionStreak === 0) { // we are at first run of the whole experiment
            PESTArray[currentIndex].directionStreak = 1; // we do not influence the step size, just set the direction for future decisions

        } else if (PESTArray[currentIndex].directionStreak < 0) { // if we change direction from negative
            PESTArray[currentIndex].step /= 2; // half the step
            PESTArray[currentIndex].stepChange = 1 / 2; // record the step change
            PESTArray[currentIndex].directionStreak = 2; // and set the new direction

        } else if (PESTArray[currentIndex].directionStreak === 1) {
            PESTArray[currentIndex].directionStreak = 2; // continue to 2nd step

        } else if (PESTArray[currentIndex].directionStreak === 2) {
            PESTArray[currentIndex].directionStreak = 3; // continue to 3rd step

        }else if (PESTArray[currentIndex].directionStreak === 3) { // if we have made 3 steps in the positive direction (away from 0 CA)
            if (PESTArray[currentIndex].stepChange !== 2) { // we check if the last step change was a doubling
                PESTArray[currentIndex].step *= 2;  // and if it was not, we double the step now
                PESTArray[currentIndex].stepChange = 2; // and record the doubling
            }
            PESTArray[currentIndex].directionStreak = 4; // continue to 4th step

        } else { // starting from step 4 onwards
            PESTArray[currentIndex].step *= 2; // we double the step
            PESTArray[currentIndex].stepChange = 2; // and record the type of change
            PESTArray[currentIndex].directionStreak += 1; // continue counting
        }
        imgValue = decideNextValue(1); // increase blur
        PESTArray[currentIndex].run += 1;

    } else if (PESTArray[currentIndex].correctTrial >= ratio + constantW) { // too many right answers
        if (PESTArray[currentIndex].directionStreak === 0) { // we are at first run of the whole experiment
            PESTArray[currentIndex].directionStreak = -1; // we do not influence the step size, just set the direction for future decisions

        } else if (PESTArray[currentIndex].directionStreak > 0) { // if we change direction from positive
            PESTArray[currentIndex].step /= 2; // half the step
            PESTArray[currentIndex].stepChange = 1 / 2; // record the step change
            PESTArray[currentIndex].directionStreak = -2; // and set the new direction

        }else if (PESTArray[currentIndex].directionStreak === -1) {
            PESTArray[currentIndex].directionStreak = -2; // continue to 2nd step

        }else if (PESTArray[currentIndex].directionStreak === -2) {
            PESTArray[currentIndex].directionStreak = -3; // continue to 3rd step

        } else if (PESTArray[currentIndex].directionStreak === -3) { // if we have made 3 steps in the negative direction (towards 0 CA)
            if (PESTArray[currentIndex].stepChange !== 2) { // we check if the last step change was a doubling
                PESTArray[currentIndex].step *= 2;  // and if it was not, we double the step now
                PESTArray[currentIndex].stepChange = 2; // and record the doubling
            }
            PESTArray[currentIndex].directionStreak = -4; // continue to 4th step

        } else { // starting from step 4 onwards
            PESTArray[currentIndex].step *= 2; // we double the step
            PESTArray[currentIndex].stepChange = 2; // and record the type of change
            PESTArray[currentIndex].directionStreak -= 1; // continue counting
        }
        imgValue = decideNextValue(-1); // decrease blur
        PESTArray[currentIndex].run += 1;

    }
    if (imgValue !== PESTArray[currentIndex].value) {
        PESTArray[currentIndex].trialPerRun.push(PESTArray[currentIndex].trial);
        PESTArray[currentIndex].valueHistory.push(PESTArray[currentIndex].value);
        // if the blur value has changed, reset the number of trials of the run
        PESTArray[currentIndex].trial = 0;
        PESTArray[currentIndex].correctTrial = 0;
    }
    if(PESTArray[currentIndex].step <= PESTStop || PESTArray[currentIndex].run > 20){
        PESTArray[currentIndex].status = 1;
        const saveRun = JSON.stringify(PESTArray[currentIndex]);
        localStorage.setItem(`run${currentIndex}`, saveRun);
    }

    return imgValue;
}

function trialAnswer(polarity) {

    // do pest decision here.
    var blurValue = PESTDecision(polarity);
    PESTArray[currentIndex].value = blurValue;

    updateXY('red',0,0);
    updateXY('blue',0,0);
    //updateXY(PESTArray[currentIndex].color, blurValue, 0);

    drawCurves();
    changeImage();
    var audio = document.getElementById("audio");
    audio.play();
}

// function addBlur(colour) {
//
//     var value = xy[colour][0] + stepValue;
//     if (value > 150)
//         value = 150;
//     updateXY(colour, value, 0);
//     drawCurves();
//     changeImage();
//
// }
//
// function subtractBlur(colour) {
//     var value = xy[colour][0] - stepValue;
//     if (value < -150)
//         value = -150;
//     updateXY(colour, value, 0);
//     drawCurves();
//     changeImage();
// }

////////////////////////////// NOT V /////////////////////////////
function focusChanged() {
    focus = parseInt($('#focus').val());
    $('#focusValue').val('(' + focus + ')');
    //refreshChart();
    //refreshImage();
}

function refreshChart() {
    drawCurves();
    //drawRays();
    $('#focusLine').css({'left': xLeftBase + focus});
}

function curveDrag(ui) {
    ui.position.left = Math.max(-cw / 2 + 5, Math.min(cw / 2 - 5, ui.position.left + cw)) - cw;
    ui.position.top = Math.min(0, Math.max(-ch + 15, ui.position.top + ch)) - ch;
    updateXY(ui.helper.context.id.substring(0, ui.helper.context.id.indexOf('Curve')),
        ui.position.left + cw, -ui.position.top - ch);
    drawCurves();
    //drawRays();
    refreshImage();
}


function updateXY(colour, x, y) {
    xy[colour] = [x, y];
    $('#' + colour + 'XY').text('(' + xy[colour][0] + ',' + xy[colour][1] + ')');
}

function updateSliders() {
    // ['focus', 'redLat', 'greenLat', 'blueLat'].forEach(function (e) {
    //     $('#' + e + 'Value').val('(' + $('#' + e).val() + ')');
    // });

}

document.getElementById('resetLat').onclick = function () {
    resetSliders();
};

function resetSliders() {
    ['redLat', 'greenLat', 'blueLat'].forEach(function (e) {
        // $('#' + e + 'Value').val(0);
        document.getElementById(e).value = 0;
    });
    refreshImage();

}

function changeColor(ctrl, colour) {
    $('#control button').css({'background': '#dddddd', 'color': 'black'});
    $(ctrl).css({'background': colour, 'color': 'white'});
    $('.dragLayer').css({'z-index': -10});
    $('#' + colour + 'Curve').css({'z-index': 0});
}

function drawCurves() {
    var ctx = curveCanv.ctx;
    ctx.clearRect(0, 0, curveCanv.w, curveCanv.h);
    ctx.globalCompositeOperation = 'screen';
    for (var c in xy) {
        ctx.beginPath();
        ctx.strokeStyle = rgb[c];
        ctx.lineWidth = 3;
        var xOffset = xy[c][0];
        var yOffset = -xy[c][1];
        ctx.moveTo(xOffset, ch - pts[zPt / 2] + yOffset);
        for (var i = 1; i <= zPt; i += 2)
            ctx.lineTo(i + xOffset, ch - pts[i + zPt / 2] + yOffset);
        ctx.stroke();
    }
}

function drawRays() {
    var lens = {
        x: 40, y: ch / 2, thickness: 15, radius: ch / 2 - 5, leftRadius: 200,
        rightRadius: 200, focalLength: 190
    };
    var ctx = raysCanv.ctx;
    ctx.clearRect(0, 0, raysCanv.w, raysCanv.h);
    var xFocal = lens.x + lens.focalLength;
    ctx.lineWidth = 3;
    ctx.globalCompositeOperation = 'screen';
    for (var flip = -1; flip <= 1; flip += 2) {
        for (var c in xy) {
            ctx.beginPath();  // Long CA rays
            var yOffset = (lens.radius - 12) * flip; // vertical offset based on lens radius
            ctx.moveTo(0, lens.y + yOffset);
            ctx.lineTo(lens.x - lens.thickness, lens.y + yOffset);
            yOffset -= (2 - xy[c][0] / 75) * flip; // then it is adjusted using the CA value
            var xa = lens.x + lens.thickness;
            var ya = lens.y + yOffset;
            ctx.lineTo(xa, ya);
            var xb = xFocal + xy[c][0] / 5;
            var yb = lens.y;
            var x = xFocal + focus / 4;
            ctx.lineTo(x, (yb - ya) / (xb - xa) * (x - xa) + ya);
            ctx.strokeStyle = rgb[c];
            ctx.stroke();

            ctx.beginPath();  // Lat CA rays
            ctx.strokeStyle = rgb[c];
            yOffset = (lens.radius - 12) * flip;
            xa = lens.x + lens.thickness;
            ya = lens.y + yOffset - (2 - xy[c][0] / 75) * flip;
            ctx.setLineDash([4, 10]);
            ctx.moveTo(xa, ya);
            ctx.lineTo(lens.x - lens.thickness, ya + 10);
            ctx.lineTo(0, ya + 20);
            ctx.stroke();
            ctx.beginPath();
            ctx.setLineDash([4, 19]);
            xb = xFocal + (latLinked ? xy[c][0] / 4 : 0);
            yb = lens.y - Math.abs(yOffset) + 20 + (latLinked ? xy[c][0] / 75 : -lat[c] / 4);
            x = xFocal - lens.focalLength / ((flip < 0) ? 2 : 8);
            ctx.moveTo(xa, ya);
            ctx.lineTo(x, (yb - ya) / (xb - xa) * (x - xa) + ya);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(x, (yb - ya) / (xb - xa) * (x - xa) + ya);
            ctx.setLineDash([]);
            x = xFocal + focus / 4;
            ctx.lineTo(x, (yb - ya) / (xb - xa) * (x - xa) + ya);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;

    ctx.beginPath();    // draw screen
    var x = xFocal + focus / 4 + ctx.lineWidth;
    ctx.moveTo(x, lens.y - lens.radius + 5);
    ctx.lineTo(x, lens.y + lens.radius - 5);
    ctx.stroke();

    ctx.beginPath();   // draw the top and bottom edges of the lens
    ctx.moveTo(lens.x - (lens.thickness / 2), lens.y - lens.radius);
    ctx.lineTo(lens.x + (lens.thickness / 2), lens.y - lens.radius);
    ctx.moveTo(lens.x - (lens.thickness / 2), lens.y + lens.radius);
    ctx.lineTo(lens.x + (lens.thickness / 2), lens.y + lens.radius);
    ctx.stroke();

    ctx.beginPath();   // draw the left face of the lens
    var lensToCircleRatio = lens.radius / lens.leftRadius;
    var xOffset = lens.leftRadius * Math.cos(Math.asin(lensToCircleRatio)) - (lens.thickness / 2);  //change the - to a + for a right-side concave face
    var arcStart = Math.PI - Math.asin(lensToCircleRatio);
    var arcEnd = Math.PI + Math.asin(lensToCircleRatio);
    ctx.arc(lens.x + xOffset, lens.y, lens.leftRadius, arcStart, arcEnd);
    ctx.stroke();

    ctx.beginPath();  // draw the right face of the lens
    lensToCircleRatio = lens.radius / lens.rightRadius;
    xOffset = lens.rightRadius * Math.cos(Math.asin(lensToCircleRatio)) - (lens.thickness / 2);     //change the - to a + for a left-side concave face
    arcStart = -1 * Math.asin(lensToCircleRatio);
    arcEnd = Math.asin(lensToCircleRatio);
    ctx.arc(lens.x - xOffset, lens.y, lens.rightRadius, arcStart, arcEnd);
    ctx.stroke();

    var d = 27;  // draw blurred colour dots
    var t = (ch - ((d + 5) * 3 - 5)) / 2
    for (var i = 0; i < 3; i++) {
        ctx.fillStyle = 'black';
        ctx.fillRect(raysCanv.w - d - 5, i * (d + 5) + t, d, d);
        ctx.filter = 'blur(' +
            (Math.abs(focus / 4 - xy[colours[i]][0] / 4) + xy[colours[i]][1] / 20) / 2 +
            'px)';
        ctx.beginPath();
        ctx.arc(raysCanv.w - 5 - d / 2, i * (d + 5) + t + d / 2, 5, 0, Math.PI * 2);
        ctx.fillStyle = rgb[colours[i]];
        ctx.fill();
        ctx.filter = 'none';
    }
}

function loadRGB() {
    iw = srcImg.width;
    ih = srcImg.height;
    $('#stageFrame').css({'width': iw, 'height': ih});
    r = new Canv(null, iw + blurBuf * 2, ih + blurBuf * 2);
    g = new Canv(null, r.w, r.h);
    b = new Canv(null, r.w, r.h);
    r.ctx.drawImage(srcImg, blurBuf, blurBuf, iw, ih);
    r.getData();
    for (var y = blurBuf; y < (r.h - blurBuf); y++)  // add bluf buffers
        for (var c = 0; c < 4; c++) {
            var v = r.px[(y * r.w + blurBuf) * 4 + c];
            for (var x = 0; x < blurBuf; x++)
                r.px[(y * r.w + x) * 4 + c] = v;
            v = r.px[(y * r.w + r.w - blurBuf - 1) * 4 + c];
            for (var x = r.w - blurBuf; x < r.w; x++)
                r.px[(y * r.w + x) * 4 + c] = v;
        }
    for (var x = blurBuf; x < (r.w - blurBuf); x++)
        for (var c = 0; c < 4; c++) {
            var v = r.px[(blurBuf * r.w + x) * 4 + c];
            for (var y = 0; y < blurBuf; y++)
                r.px[(y * r.w + x) * 4 + c] = v;
            v = r.px[((r.h - blurBuf - 1) * r.w + x) * 4 + c];
            for (var y = r.h - blurBuf; y < r.h; y++)
                r.px[(y * r.w + x) * 4 + c] = v;
        }
    r.putData();
    var tw = r.w;
    for (var x = 0; x < tw; x++)  // split img into r, g, b
        for (var y = 0; y < r.h; y++) {
            g.px[(y * tw + x) * 4 + 1] = r.px[(y * tw + x) * 4 + 1];
            b.px[(y * tw + x) * 4 + 2] = r.px[(y * tw + x) * 4 + 2];
            r.px[(y * tw + x) * 4 + 1] = 0;
            r.px[(y * tw + x) * 4 + 2] = 0;
        }
    r.putData();
    g.putData();
    b.putData();
}

function loadPreset(deviceNum) {
    for (var j = 0; j < 3; j++) {
        var c = colours[j];
        var preset = presets[deviceNum][j];
        updateXY(c, Math.round(preset[0]), Math.round(preset[1]));
        $('#' + c + 'Curve').css({'left': xy[c][0] - cw, 'top': -xy[c][1] - ch})
        $('#lat input[type=range]').eq(j).val(presets[deviceNum][4][j]);
    }
    $('#linked').prop('checked', presets[deviceNum][3]);
//   if ($("input[id=linked]").is(':checked'))
//     for (var j = 0; j < 3; j++)
//       $('#lat input[type=range]').eq(j).val(presets[deviceNum][j][0]);
    focus = presets[deviceNum][1][0];  // set focus to greenBlur
    //$('#focus').val(focus);
    readUi();
    refreshChart();
    renderImage();
}

function renderImage() {
    if ($(srcImg).attr('src') == $("input[name='photo']:checked").val() && false)
        refreshImage();
    else {
        $(srcImg).one('load', function () {
            loadRGB();
            updateXY(PESTArray[currentIndex].color, PESTArray[currentIndex].value, 0);
            console.log("Color: " +  PESTArray[currentIndex].color + "  " + '(' + xy['red'][0] + ',' + xy['blue'][0] + ')');
            refreshImage();
        });
        $(srcImg).attr('src', `testImages/${currentIndex}image.jpg`);
    }

    //drawRays();
}

function readUi() {
    updateSliders();
    for (var c in lat)
        lat[c] = parseInt($('#' + c + 'Lat').val());
    latLinked = $("input[id=linked]").is(':checked');
    $('#lat input[type=range]').attr('disabled', latLinked);
    $('#latSliders').css({'display': (latLinked ? 'none' : 'block')});
}

function getBlur(colour) {
    return Math.round((pts[Math.round(zPt - xy[colour][0]) + focus] + xy[colour][1]) / pts[0] * 70 * 10) / 10; // round had to be used here to work with decimal blur values...
}

function refreshImage() {
    readUi();
    var blur = [];
    for (var i = 0; i < 3; i++) {
        blur[i] = getBlur(colours[i]);
        $('#' + colours[i].substring(0, 1) + 'd').text('(' + blur[i] + ')');
    }
    var stage = canvFromID('stage', r.w, r.h);
    addTo(stage, r, 'blur(' + blur[0] + 'px)', latLinked ? blur[0] : lat['red']);
    addTo(stage, g, 'blur(' + blur[1] + 'px)', latLinked ? blur[1] : lat['green']);
    addTo(stage, b, 'blur(' + blur[2] + 'px)', latLinked ? blur[2] : lat['blue']);
}

function addTo(destCanv, srcCanv, filter, scalePx) {
    var addendCanvas = srcCanv.canvas.cloneNode(true);
    var addendCtx = addendCanvas.getContext('2d');
    addendCtx.globalCompositeOperation = 'destination-out';
    addendCtx.filter = filter;
    addendCtx.globalCompositeOperation = 'source-over';
    var scale = 1.0 + scalePx / iw;
    addendCtx.scale(scale, scale);
    var sx = -scalePx / 2 * scale * 1.01;
    addendCtx.drawImage(srcCanv.canvas, sx, sx * ih / iw * 1.03);
    destCanv.ctx.globalCompositeOperation = 'lighter';
    destCanv.ctx.drawImage(addendCanvas, 0, 0);
}

function saveCanvas(el, id) {
    var tmpCanv;
    if (id == 'rays') {
        tmpCanv = new Canv(null, 250, 150);
        tmpCanv.ctx.fillStyle = '#dcdcdc';
        tmpCanv.ctx.fillRect(0, 0, tmpCanv.w, tmpCanv.h);
        tmpCanv.ctx.drawImage(raysCanv.canvas, 0, 0, tmpCanv.w, tmpCanv.h, 0, 0, tmpCanv.w, tmpCanv.h);
    } else {
        tmpCanv = new Canv(null, 200, 150);
        tmpCanv.ctx.drawImage(stage, 0, 0, stage.width, stage.height, 0, 0, tmpCanv.w, tmpCanv.h);
    }
    el.href = tmpCanv.canvas.toDataURL('image/png');
}

// **********************************
/** @constructor */
function Canv(canv, w, h) {
    // to access a px at x,y: [(y * this.w + x) * 4 + c] = value;
    this.getData = function () {
        this.data = this.ctx.getImageData(0, 0, this.w, this.h);
        this.px = this.data.data;
        for (var i = 3; i < this.px.length; i += 4)
            this.px[i] = 255;  // make sure alpha is 1 for entire canvas
    }
    this.putData = function () {
        this.ctx.putImageData(this.data, 0, 0);
    }
    if (!canv)
        canv = document.createElement('canvas');
    this.canvas = canv;
    this.w = w;
    this.h = h;
    canv.width = w;
    canv.height = h;
    canv.style.width = w + 'px';
    canv.style.height = h + 'px';
    //canv.style.imageRendering = 'pixelated';
    this.ctx = canv.getContext('2d');
    //this.ctx.imageSmoothingEnabled = false;
    this.getData();
}

function canvFromID(id, w, h) {
    return new Canv(document.querySelector('#' + id), w, h);
}
