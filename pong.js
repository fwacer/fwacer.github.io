/*
 * File: pong.js
 * Title: PONG CLONE
 * Author: Bryce Dombrowski
 *
 * Date: March 4th, 2018
 *
 * Sites:   brycedombrowski.com
 *          github.com/fwacer
 *
 * Contact: brycetdombrowski@gmail.com
 *
 * Info: This was just a simple foray into javascript and the p5 library.
 * I had watched a few of TheCodingTrain's videos and wanted to see the differences  first-hand 
 * between C++ with Qt versus p5.js. It was a fun experience, and I definitely may use it in the future for
 * quick animations! 
 * 
 * Note: The speed of the ball and the size of all the items in screen
 * change depending on the size of the browser window. It will resize automatically
 * as well. Unfortunately, the proportions don't look perfect at all different
 * window sizes, but I tried to find a happy medium. Fun fact: If the window is very
 * short in height but long in width, the ball will phase right through the paddle.
 *
 * Possible things to add:
 * A toggle-able AI for one or both sides.
 *
 * Libraries:
 * This makes use of the p5.js libraries: https://p5js.org/
 * 
 */

// Constants
var BUMPER_VERT_ACCEL = 0.07;
var VERTICAL_RICOCHET_SPEED = 2;
// GLobal variables that vary with the size of the window
var HORIZONTAL_BALL_START_SPEED;
var VERTICAL_BALL_START_SPEED;
// Objects
var ball;
var bumper_left;
var bumper_right;
var graphicsItems;
// Score
var score_left = 0;
var score_right = 0;
var rally = 0;

// Ball class
function Ball(x_vel, y_vel){
	this.x = width/2;
	this.y = height/2;
	this.size = (width/40 < height/20) ? width/40 : height/20;
	this.x_vel = x_vel;
	this.y_vel = y_vel;
	
	// Resets the ball to the middle after scoring, serving to the person who was scored on.
	this.resetPos = function(x_dir){
		// Input is 1 or -1
		graphicsItems.pop();
		ball = new Ball(x_dir * HORIZONTAL_BALL_START_SPEED, map(random(1),0,1,-1,1) * VERTICAL_BALL_START_SPEED);
		graphicsItems.push(ball);
	}
	//Updates the postion of the ball, and checks if it has scored or bumped an object.
	this.update = function(){
		if (bumper_left.bounding_box(this.x,this.y) || bumper_right.bounding_box(this.x,this.y)){
			// Reverse direction
			this.x_vel = -this.x_vel; 
			// Keeps track of the current rally.
			rally += 1;
			// Gets the Y-position of the bumper it is touching.
			var y;
			if (this.x < width/2){
				y = bumper_left.getY();
			}else{
				y = bumper_right.getY();
			}
			// Add to vertical velocity if the ball doesn't hit the exact centre.
			this.y_vel += map(this.y - y, 0,bumper_left.height/2, 0, VERTICAL_RICOCHET_SPEED); 
		}
		
		// Adds collision to the top and bottom of the viewport.
		if (this.y < 0 || this.y > height){ 
			this.y_vel = -this.y_vel;
		}
		
		// Checks if scored
		if (this.x < 0){
			background(50, 89, 100);
			score_right += 1;
			rally = 0;
			this.resetPos(-1);
		} else if (this.x > width){
			background(50, 89, 100);
			score_left += 1;
			rally = 0;
			this.resetPos(1);
		}
		// Updates position
		this.x += this.x_vel;
		this.y += this.y_vel;
	};
	// Draws the ball
	this.show = function(){
		// The push and pop are unneccesary, only useful if I wished to rotate the ellipse.
		push();
		noStroke;
		fill(255);
		translate(this.x, this.y);
		ellipse(0,0, this.size, this.size);
		pop();
	};
};
// Bumper Class (The 'Paddle')
function Bumper(x_pos){
	this.x = x_pos;
	this.y = height/2;
	this.width = (width/40 < height/20) ? width/40 : height/20;
	this.height = this.width*7;
	this.y_vel = 0;
	this.y_accel = 0;
	// Returns if the given coordinate is in the bounding box.
	this.bounding_box = function(x,y){
		if (x < this.x + this.width/2 && x > this.x - this.width/2){
			if (y < this.y + this.height/2 && y > this.y - this.height/2){
				return true;
			}
		}
		return false;
	}
	// Returns the y coordinate
	this.getY = function(){
		return this.y;
	}
	// Updates the position of the bumper
	this.update = function(){
		// Stops the bumper if it touches the top or bottom.
		// An alternate idea is to bounce off, multiply the velocity/acceleration by -1.
		if (this.y + this.height/2 > height){
			this.y = height - this.height/2;
			this.y_accel = 0;
			this.y_vel = 0;
		}
		else if(this.y - this.height/2 < 0){
			this.y = this.height/2;
			this.y_accel = 0;
			this.y_vel = 0;
		}
		// Update position
		this.y_vel += this.y_accel;
		this.y += this.y_vel;
		// The bumper will slow to a stop
		this.y_accel *= 0.5;
		this.y_vel *= 0.99;
	};
	// Draws the bumper
	this.show = function(){
		// The push and pop are unneccesary, only useful if I wished to rotate the rectangle.
		push();
		noStroke;
		fill(255);
		translate(this.x, this.y);
		rectMode(CENTER);
		rect(0,0, this.width, this.height);
		pop();
	};
};
// GraphicsItems Class
// Works similar to a QGraphicsScene from Qt, takes care of updating and displaying all given 'items'.
function GraphicsItems(items){
	if (items){
		this.items = items;
	} else{
		this.items = [];
	}
	this.pushList = function(item_list){
		items += item_list;
	}
	this.push = function(item){
		items.push(item);
	}
	this.pop = function(){
		items.pop();
	}
	this.run = function() {
		for (var i = 0; i < this.items.length; i++) {
			this.items[i].update();
			this.items[i].show();
		}
	}
};

function setup() {
	createCanvas(windowWidth - 4, windowHeight - 4);
	background(50, 89, 100);
	
	HORIZONTAL_BALL_START_SPEED = windowWidth / 170;
	HORIZONTAL_BALL_START_SPEED = ( width / 40 ) / 4;
	VERTICAL_BALL_START_SPEED = windowHeight / 350;
	
	var x_dir = 1;
	if (random(1) > 0.5){ // Pick a random direction to start
		x_dir = -1; 
	}
	ball = new Ball(x_dir * HORIZONTAL_BALL_START_SPEED, map(random(1),0,1,-1,1) * VERTICAL_BALL_START_SPEED);
	bumper_left = new Bumper(20);
	bumper_right = new Bumper(width-20);
	graphicsItems = new GraphicsItems([bumper_left, bumper_right, ball]);
}

function draw() {
	background(50, 89, 100);
	
	textAlign(CENTER);
	textSize(32);
	fill(255);
	text('PONG\nCLONE', width/2, height/2);
	text(String(score_left), 30, height - 20);
	text(String(score_right), width - 30, height - 20);
	text(String(rally), width/2, height - 20);
	
	graphicsItems.run();
	checkInput();
}
function checkInput(){
	if (keyIsDown(UP_ARROW)) {
		bumper_right.y_accel -= BUMPER_VERT_ACCEL;
	}
	if (keyIsDown(DOWN_ARROW)) {
		bumper_right.y_accel += BUMPER_VERT_ACCEL;
	}
	if (keyIsDown(87)){
		bumper_left.y_accel -= BUMPER_VERT_ACCEL;
	}
	if (keyIsDown(83)){
		bumper_left.y_accel += BUMPER_VERT_ACCEL;
	}
	return false;
}
function windowResized() {
	setup();
}