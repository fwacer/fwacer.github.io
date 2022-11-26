/// <reference path="./lib/TSDef/p5.global-mode.d.ts" />
/*
Author: Bryce Dombrowski
Date: 2022-11-25
License: See license file

Note: Trademark belongs to Niricson Software Inc.
*/
"use strict";
const emFromCanvasWidthRatio = 10; // the canvas div is 10em wide
var foregroundColour;
var backgroundColour;
var size_1em;
var refImage;
var devMode = false;
var openSimplex;
var noiseSeedInput = 3.059061338798039;
var animationTimeIndex = 0;

var circlesList = [];

function draw_numbers(){
    // dev function for showing the grid numbers
    stroke(0);
    fill(0,0,0, 0);
    for (let col=0; col<10; col++){
        text(str(col), (col-.2)*size_1em, (0.3)*size_1em);
    }
    for (let row=1; row<7; row++){
        text(str(row), (0)*size_1em, (row)*size_1em);
    }
}

function setup() {
    let canvasDiv = document.getElementById('logo-splat');
    let sketchCanvas = createCanvas(canvasDiv.offsetWidth,canvasDiv.offsetHeight);
    sketchCanvas.parent('logo-splat');

    size_1em = canvasDiv.offsetWidth/emFromCanvasWidthRatio;
    
    openSimplex = openSimplexNoise(noiseSeedInput);
    foregroundColour = window.getComputedStyle(document.getElementById('logo-splat')).color;
    backgroundColour = window.getComputedStyle(document.getElementById('logo-frame')).backgroundColor;
    createSplat();
}


function draw() {
    background(backgroundColour);
    let canvasDiv = document.getElementById('logo-frame');
    if (devMode){
        draw_numbers() // Temporary, helper to show grid
    }
    drawSplat();
}

function Circle(row, col, ellipseSizeRatio){
    // Each row is 1em tall, each col is 1em wide
    this.row = row;
    this.col = col;
    this.ellipseSizeRatio = ellipseSizeRatio;
}
Circle.prototype.draw = function(sizeMultiplierFcn){
    let ellipseMaxSize = size_1em * 0.25;
    let ellipseOffsetX = size_1em / 4;
    let ellipseOffsetY = size_1em / 5;

    fill(foregroundColour);
    stroke(foregroundColour);
    let tempSizeMultiplier = sizeMultiplierFcn(animationTimeIndex, this.row, this.col);
    
    ellipse(
        size_1em*this.row+ellipseOffsetX,
        size_1em*this.col+ellipseOffsetY,
        ellipseMaxSize*this.ellipseSizeRatio*tempSizeMultiplier
        );
}


function change_seed(){
    noiseSeedInput = random(20);
    openSimplex = openSimplexNoise(noiseSeedInput);
    console.log(noiseSeedInput);
    // 2, 8, 21
}

function createSplat(){
    // Create circleObjects
    // maybe try an array instead with the num of dots per side on the row? then evenly spread through?
    // try feathering
    // rows are counted as 1/3 EM
    let linesToEmRatio = 1.0/3.0;
    let centreOfSplatX = 14;
    let centreOfSplatY = 11;
    let rightDotsPerRow = [
        0,
        0,
        0,
        2,
        4,
        6,
        5,
        8,
        12,
        13,
        13,
        12,
        12,
        12,
        8,
        8,
        7,
        6,
        2,
        0
    ];
    let leftDotsPerRow = [
        0,
        0,
        0,
        2,
        4,
        6,
        6,
        8,
        8,
        10,
        8,
        10,
        12,
        12,
        11,
        10,
        8,
        6,
        6,
        0
    ];
    let rowMax = 21;
    for (let row=0; row<rowMax; row++){
        let colMax = rightDotsPerRow[row];
        for (let local_col=0; local_col<colMax; local_col++){

            let columnSizeRatio =  1-abs(local_col/colMax);
            let rowSizeRatio = 1 - abs(row-12)/(rowMax-4);
            let sizeRatio = columnSizeRatio*rowSizeRatio;
            //sizeRatio = 1;
            circlesList.push(new Circle((local_col+centreOfSplatX)*linesToEmRatio, row*linesToEmRatio, sizeRatio));// + sizeRatio*0.3*openSimplex.noise2D(local_col, row)));
        }
    }
    
    for (let row=0; row<rowMax; row++){
        let colMax = leftDotsPerRow[row];
        for (let local_col=0; local_col>-colMax; local_col--){

            let columnSizeRatio =  1-abs(local_col/colMax);
            let rowSizeRatio = 1 - abs(row-12)/(rowMax-4);
            let sizeRatio = columnSizeRatio*rowSizeRatio;
            //sizeRatio = 1;
            circlesList.push(new Circle((local_col+centreOfSplatX)*linesToEmRatio, row*linesToEmRatio, sizeRatio));// + sizeRatio*0.3*openSimplex.noise2D(local_col, row)));
        }
    }
    

}

function drawSplat(){
    let centreOfSplatX = 4.66;
    let centreOfSplatY = 3.5;
    
    function getRippleMultiplier(animationTimeIndex,absX,absY){
        let relX = absX-centreOfSplatX;
        let relY = absY-centreOfSplatY;
        let objectRadiusFromCentre = sqrt(relX**2 + relY**2);

        let pulseRadius = animationTimeIndex*0.05;
        //let multiplier = 1/abs(pulseRadius-objectRadiusFromCentre);
        let multiplier = cos(1.2*(pulseRadius-objectRadiusFromCentre))*1.5;
        return Math.min(Math.max(multiplier, .8), 2);
    }
    function getWaveMultiplier(animationTimeIndex,absX,absY){
        let relX = absX-centreOfSplatX;
        let relY = absY-centreOfSplatY;
        let objectRadiusFromCentre = sqrt(relX**2 + relY**2);

        let waveDistance = animationTimeIndex*0.05;
        //let multiplier = 1/abs(pulseRadius-objectRadiusFromCentre);
        let multiplier = cos(1.2*(waveDistance-relX))*1.5;
        return Math.min(Math.max(multiplier, .8), 2);
    }
    let animationOptions = {
        "none": function(animationTimeIndex,absX,absY){return 1;},
        "ripple": getRippleMultiplier,
        "wave": getWaveMultiplier
    }
    let animationSelection =  document.getElementById('animation-selection').value;
    
    for (let i=0; i< circlesList.length; i++){
        circlesList[i].draw(animationOptions[animationSelection]);
    }
    animationTimeIndex++;
}

function windowResized(){
    // Fill to size of div
    let canvasDiv = document.getElementById('logo-splat');
    resizeCanvas(canvasDiv.offsetWidth,canvasDiv.offsetHeight);
    size_1em = canvasDiv.offsetWidth/emFromCanvasWidthRatio;
}

