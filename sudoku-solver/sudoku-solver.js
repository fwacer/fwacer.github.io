/*
 * File: sudoku-solver.js
 * Title: PONG CLONE
 * Author: Bryce Dombrowski
 *
 * Date: January 29th, 2022
 *
 * Sites:   brycedombrowski.com
 *          github.com/fwacer
 *
 * Contact: brycetdombrowski@gmail.com
 *
 * Info: 
 * This is a simple sudoku solver that I made for fun
 * 
 * Notes: 
 *
 *
 * Possible things to add:
 *  Other sudoku modes (sumoku, etc)
 *
 * Libraries:
 * This makes use of the p5.js libraries: https://p5js.org/
 * 
 */

// Constants
var SUDOKU_SQUARE_SIZE = 50;
var SUDOKU_MAX_SOLVE_ATTEMPTS = 100;

// Objects
var graphicsItems; // List of graphics items that are updated
var numberGrid; // NumberGrid object handle
var textBox;

// GLobals
var sudokuSolved = false;
var solveAttempts = 0;
var arbitarySelectionThreshold = 1; // Number of possible items in the list before the algorithm will choose an option
var startSolveCommand = false;
var firstSudokuSolveCycle = true;

// Input Box class (for the numbers)
function InputBox(x,y){
	// Note: 
	this.x = x;
	this.y = y;
	this.width = SUDOKU_SQUARE_SIZE;
	this.height = SUDOKU_SQUARE_SIZE;
	this.displayNumber = 0;
	this.possibleValues = [1,2,3,4,5,6,7,8,9]; // used by the solver algorithm
	this.textColour = color(0,0,0);

	//Updates the displayed number if clicked
	this.mouseClicked = function(x,y){
		if ((x > this.x) && (x < (this.x + this.width))
		&& (y > this.y) && (y < (this.y + this.height))){
			this.displayNumber++;
			if (this.displayNumber > 9) {
				this.displayNumber = 0;
			}
			console.log(this.displayNumber)
		}
		//this.displayNumber = ;
	};

	this.update = function(){

		//this.displayNumber = ;
	};
	// Draws the input box
	this.show = function(){
		// The push and pop are unneccesary, only useful if I wished to rotate the object.
		push();
		fill(255);
		strokeWeight(1);
		translate(this.x, this.y);
		//textSize(32);
		rect(0,0, this.width, this.height);

		textSize(32);
		fill(this.textColour);
		if (this.displayNumber != 0) text(this.displayNumber+'', this.width/2, this.height/4*3);
		pop();
	};
};
function mouseClicked(event) {
	//console.log(event);
	numberGrid.mouseClicked(event.x,event.y);
	return false;
}
// NumberGrid class (for the input box numbers)
function NumberGrid(x,y){
	// Note: 
	this.x = x;
	this.y = y;
	this.numberGridArray = [];
	this.selectedNumbersInRows = [];
	this.selectedNumbersInColumns = [];
	this.selectedNumbersInBlocks = [];
	this.availableNumbersInRows = [];
	this.availableNumbersInColumns = [];
	this.availableNumbersInBlocks = [];
	

	for(let rowNum = 0; rowNum < 9; rowNum++){
		let row = [];
		for (let columnNum = 0; columnNum < 9; columnNum++){
			let xPos = columnNum*SUDOKU_SQUARE_SIZE+x;
			let yPos = rowNum*SUDOKU_SQUARE_SIZE+y;
			row.push(new InputBox(xPos, yPos));
		}
		this.numberGridArray.push(row);

		this.selectedNumbersInRows.push(new Set());
		this.selectedNumbersInColumns.push(new Set());
		this.selectedNumbersInBlocks.push(new Set());

		this.availableNumbersInRows.push([]);
		this.availableNumbersInColumns.push([]);
		this.availableNumbersInBlocks.push([]);
	}
	// Checks if the click happened inside one of the boxes
	this.mouseClicked = function(x,y){
		for(let rowNum = 0; rowNum < 9; rowNum++){
			for (let columnNum = 0; columnNum < 9; columnNum++){
				this.numberGridArray[rowNum][columnNum].mouseClicked(x,y);
			}
		}
	}
	// Updates the InputBoxes.
	this.update = function(){
		for(let rowNum = 0; rowNum < 9; rowNum++){
			for (let columnNum = 0; columnNum < 9; columnNum++){
				this.numberGridArray[rowNum][columnNum].update()
			}
		}
	};
	// Shows the InputBoxes
	this.show = function(){
		for(let rowNum = 0; rowNum < 9; rowNum++){
			for (let columnNum = 0; columnNum < 9; columnNum++){
				this.numberGridArray[rowNum][columnNum].show()
			}
		}
		// Emphasis lines for the edges of the 3x3 squares
		stroke(0);
		strokeWeight(3);

		
		// Middle lines
		line(SUDOKU_SQUARE_SIZE*3+x, SUDOKU_SQUARE_SIZE*0+y, SUDOKU_SQUARE_SIZE*3+x, SUDOKU_SQUARE_SIZE*9+y); // vertical line left
		line(SUDOKU_SQUARE_SIZE*6+x, SUDOKU_SQUARE_SIZE*0+y, SUDOKU_SQUARE_SIZE*6+x, SUDOKU_SQUARE_SIZE*9+y); // vertical line right
		line(SUDOKU_SQUARE_SIZE*0+x, SUDOKU_SQUARE_SIZE*3+y, SUDOKU_SQUARE_SIZE*9+x, SUDOKU_SQUARE_SIZE*3+y); // horizontal line top
		line(SUDOKU_SQUARE_SIZE*0+x, SUDOKU_SQUARE_SIZE*6+y, SUDOKU_SQUARE_SIZE*9+x, SUDOKU_SQUARE_SIZE*6+y); // horizontal line bottom

	};
	this.getAssociatedBlock = function(rowNum, colNum){
		// returns the associated 3x3 block with that row and column
		return parseInt(parseInt(rowNum/3) * 3) + parseInt((colNum)/3);
	}
	
};

function solveSudoku(){
	console.log('solveSudoku() called ',solveAttempts);

	// Helper function
	function removeItemFromArray(arr, value) { // https://stackoverflow.com/questions/5767325/how-can-i-remove-a-specific-item-from-an-array
		var index = arr.indexOf(value);
		if (index > -1) {
		  arr.splice(index, 1);
		}
		return arr;
	}
	// Helper function
	function removeAllItemFromArray(arr, value) { // https://stackoverflow.com/questions/5767325/how-can-i-remove-a-specific-item-from-an-array
		var i = 0;
		while (i < arr.length) {
			if (arr[i] === value) {
			arr.splice(i, 1);
			} else {
			++i;
			}
		}
		return arr;
	}

	let atLeastOneValueFoundThisCycle = false;
	// Iterate through all elements (rows)
	for(let rowNum = 0; rowNum < 9; rowNum++){
		var availableNumbers = [1,2,3,4,5,6,7,8,9];
		for (let columnNum = 0; columnNum < 9; columnNum++){
			//console.log("Row=",rowNum," Col=",columnNum)
			//console.log(numberGrid.getAssociatedBlock(rowNum,columnNum))
			if(numberGrid.numberGridArray[rowNum][columnNum].displayNumber != 0){ // this number has been selected
				// Remove all copies of this number
				let currentNum = numberGrid.numberGridArray[rowNum][columnNum].displayNumber;
				removeAllItemFromArray(numberGrid.availableNumbersInBlocks[numberGrid.getAssociatedBlock(rowNum,columnNum)], currentNum);
				removeAllItemFromArray(numberGrid.availableNumbersInColumns[columnNum], currentNum);
				removeAllItemFromArray(numberGrid.availableNumbersInRows[rowNum], currentNum);

				numberGrid.selectedNumbersInRows[rowNum].add(currentNum); // Add to Set of numbers we've seen in this row
				numberGrid.selectedNumbersInColumns[columnNum].add(currentNum); // Add to Set of numbers we've seen in this column
				//console.log("Row=",rowNum," Col=",columnNum)
				//console.log(parseInt(parseInt(rowNum/3)+parseInt(columnNum/3)))
				numberGrid.selectedNumbersInBlocks[numberGrid.getAssociatedBlock(rowNum,columnNum)].add(currentNum); // Add to Set of numbers we've seen in this 3x3 block
			}else{ // This number is not yet selected
				numberGrid.numberGridArray[rowNum][columnNum].possibleValues = availableNumbers.filter(value => numberGrid.numberGridArray[rowNum][columnNum].possibleValues.includes(value))
				if (numberGrid.numberGridArray[rowNum][columnNum].possibleValues.length === 1){
					let value = numberGrid.numberGridArray[rowNum][columnNum].possibleValues[0];
					numberGrid.numberGridArray[rowNum][columnNum].displayNumber = value;
					numberGrid.numberGridArray[rowNum][columnNum].possibleValues.forEach(function(possibleValue,index){ // Remove all possible values that this now known square could have had
						removeItemFromArray(numberGrid.availableNumbersInBlocks[numberGrid.getAssociatedBlock(rowNum,columnNum)], value);
						removeItemFromArray(numberGrid.availableNumbersInColumns[columnNum], value);
						removeItemFromArray(numberGrid.availableNumbersInRows[rowNum], value);
					});
				}

				if (firstSudokuSolveCycle){
					numberGrid.numberGridArray[rowNum][columnNum].possibleValues.forEach(function(availableNumber,index){
						numberGrid.availableNumbersInRows[rowNum].push(availableNumber);
						numberGrid.availableNumbersInColumns[columnNum].push(availableNumber);
						numberGrid.availableNumbersInBlocks[numberGrid.getAssociatedBlock(rowNum,columnNum)].push(availableNumber);
					});
					
				}else{
					numberGrid.numberGridArray[rowNum][columnNum].possibleValues.forEach(function(possibleValue,index){
						//if (possibleValue) unique in col/row/block then set our displayNum to that
						if (numberGrid.availableNumbersInRows[rowNum].filter(x => x==possibleValue).length === 1
						|| numberGrid.availableNumbersInColumns[columnNum].filter(x => x==possibleValue).length === 1
						|| numberGrid.availableNumbersInBlocks[numberGrid.getAssociatedBlock(rowNum,columnNum)].filter(x => x==possibleValue).length === 1
						){
							numberGrid.numberGridArray[rowNum][columnNum].displayNumber = possibleValue;
							numberGrid.numberGridArray[rowNum][columnNum].possibleValues.forEach(function(possibleValue,index){ // Remove all possible values that this now known square could have had
								removeItemFromArray(numberGrid.availableNumbersInBlocks[numberGrid.getAssociatedBlock(rowNum,columnNum)], possibleValue);
								removeItemFromArray(numberGrid.availableNumbersInColumns[columnNum], possibleValue);
								removeItemFromArray(numberGrid.availableNumbersInRows[rowNum], possibleValue);
							});
							console.log('triggered!')
							// currently triggers way too much. Need to have a way to check if value is unique, not just exists
							/*
							Have an array for each block/row/col and add multiple copies of possible values to it the first time through all the possible values
							On subsequent iterations, remove all of one number if it's in the selected Set.
							Then we can check for uniqueness
							*/
						}
					});

					/*numberGrid.numberGridArray[rowNum][columnNum].possibleValues.forEach(function(value,index){
						//if (value) unique in col/row/block then set our displayNum to that
						if (!numberGrid.selectedNumbersInRows[rowNum].has(value)
						|| !numberGrid.selectedNumbersInColumns[columnNum].has(value)
						|| !numberGrid.selectedNumbersInBlocks[numberGrid.getAssociatedBlock(rowNum,columnNum)].has(value)
						){
							numberGrid.numberGridArray[rowNum][columnNum].displayNumber = value;
							console.log('triggered!')
							// currently triggers way too much. Need to have a way to check if value is unique, not just exists
							
							//Have an array for each block/row/col and add multiple copies of possible values to it the first time through all the possible values
							//On subsequent iterations, remove all of one number if it's in the selected Set.
							//Then we can check for uniqueness
							
						}
					});
					*/
				}
			}
		}
	}

	// Check columns for possible numbers
	for(let columnNum = 0; columnNum < 9; columnNum++){
		var availableNumbers = [1,2,3,4,5,6,7,8,9];
		for (let rowNum = 0; rowNum < 9; rowNum++){
			if(numberGrid.numberGridArray[rowNum][columnNum].displayNumber != 0){ // this number has been selected
				removeItemFromArray(availableNumbers, numberGrid.numberGridArray[rowNum][columnNum].displayNumber); // remove any numbers that we know it can't be
				//selectedNumbersInColumns.add(numberGrid.numberGridArray[rowNum][columnNum].displayNumber); // Add to Set of numbers we've seen in this row
			}else{ // This number is not yet selected
				numberGrid.numberGridArray[rowNum][columnNum].possibleValues = availableNumbers.filter(value => numberGrid.numberGridArray[rowNum][columnNum].possibleValues.includes(value))
				if (numberGrid.numberGridArray[rowNum][columnNum].possibleValues.length === 1){
					numberGrid.numberGridArray[rowNum][columnNum].displayNumber = numberGrid.numberGridArray[rowNum][columnNum].possibleValues[0];
				}
			}
		}
	}

	// Check 3x3 blocks for possible numbers
	for(let blockColumnNum = 0; blockColumnNum < 3; blockColumnNum++){
		for (let blockRowNum = 0; blockRowNum < 3; blockRowNum++){
			var availableNumbers = [1,2,3,4,5,6,7,8,9];

			// go through each element of the 3x3 block
			for(let columnNum = blockColumnNum*3; columnNum < blockColumnNum*3+3; columnNum++){
				for (let rowNum = blockRowNum*3; rowNum < blockRowNum+3; rowNum++){
					//console.log("Row=",rowNum," Col=",columnNum)
					if(numberGrid.numberGridArray[rowNum][columnNum].displayNumber != 0){// this number has been selected
						removeItemFromArray(availableNumbers, numberGrid.numberGridArray[rowNum][columnNum].displayNumber); // remove any numbers that we know it can't be
					}else{ // This number is not yet selected
						numberGrid.numberGridArray[rowNum][columnNum].possibleValues = availableNumbers.filter(value => numberGrid.numberGridArray[rowNum][columnNum].possibleValues.includes(value))
						if (numberGrid.numberGridArray[rowNum][columnNum].possibleValues.length === 1){
							numberGrid.numberGridArray[rowNum][columnNum].displayNumber = numberGrid.numberGridArray[rowNum][columnNum].possibleValues[0];
							atLeastOneValueFoundThisCycle = true;
							console.log("Found value!! Row=",rowNum," Col=",columnNum, " DisplayVal=", numberGrid.numberGridArray[rowNum][columnNum].displayNumber,
							" possibleVals=", numberGrid.numberGridArray[rowNum][columnNum].possibleValues);
						}
					}
				}
			}			
		}
	}

	if (!atLeastOneValueFoundThisCycle){
		for(let rowNum = 0; rowNum < 9; rowNum++){
			var availableNumbers = [1,2,3,4,5,6,7,8,9];
			for (let columnNum = 0; columnNum < 9; columnNum++){
				if(numberGrid.numberGridArray[rowNum][columnNum].displayNumber === 0){
					if (numberGrid.numberGridArray[rowNum][columnNum].possibleValues <= arbitarySelectionThreshold){
						// arbitrarily select only a number from a square that has two options if we are stuck
						numberGrid.numberGridArray[rowNum][columnNum].displayNumber = numberGrid.numberGridArray[rowNum][columnNum].possibleValues[0];
						console.log("Arbitrarily Selected!! Threshold=",arbitarySelectionThreshold,
							" Row=",rowNum," Col=",columnNum,
							" DisplayVal=", numberGrid.numberGridArray[rowNum][columnNum].displayNumber,
							" possibleVals=", numberGrid.numberGridArray[rowNum][columnNum].possibleValues);
						// break out of nested loop
						columnNum = 10;
						rowNum = 10;
						arbitarySelectionThreshold = 1;
						atLeastOneValueFoundThisCycle = true;
					}
				}
			}
		}
		if (!atLeastOneValueFoundThisCycle){
			arbitarySelectionThreshold++;
		}
	}else{
		arbitarySelectionThreshold = 1;
	}
	//TEMP
	/*for(let rowNum = 0; rowNum < 9; rowNum++){
		for (let columnNum = 0; columnNum < 9; columnNum++){

			if(numberGrid.numberGridArray[rowNum][columnNum].displayNumber === 0){
				console.log("Row=",rowNum," Col=",columnNum, " DisplayVal=", numberGrid.numberGridArray[rowNum][columnNum].displayNumber,
				" possibleVals=", numberGrid.numberGridArray[rowNum][columnNum].possibleValues);
			}
		}
	}*/
	//END TEMP
	solveAttempts++;
	firstSudokuSolveCycle = false;
	if (solveAttempts > SUDOKU_MAX_SOLVE_ATTEMPTS || sudokuSolved) {
		startSolveCommand = false;
		solveAttempts = 0;
		firstSudokuSolveCycle = true;
		return;
	}
	//console.log("found?=",atLeastOneValueFoundThisCycle," th=",arbitarySelectionThreshold);
}


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
function textBoxTyping() {
	// this function is called every time the user edits the value inside the text box
	console.log('you are typing: ', this.value());
	let rowNum = 0;
	let columnNum = 0;
	let valuesString = (this.value()+'000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000').substr(0, 81);
	console.log('you are typing: ', valuesString);
	for (let index = 0; index < valuesString.length; index++) {
		character = valuesString[index];
		let currentIndex = index;
		/*columnNum = 0;
		while (!(currentIndex < 9)){
			columnNum++;
			currentIndex -= 9;
		}
		rowNum = currentIndex;
		if (!(columnNum < 9)){
			break;
		}*/
		rowNum = 0;
		while (!(currentIndex < 9)){
			rowNum++;
			currentIndex -= 9;
		}
		columnNum = currentIndex;
		if (!(rowNum < 9)){
			break;
		}

		if (!([1,2,3,4,5,6,7,8,9,0,''].includes(parseInt(character)))){
			character = 0; // override not-allowed character
		}
		if (character === ' ' || character === '0'){
			character = '0';
			numberGrid.numberGridArray[rowNum][columnNum].textColour = color(50, 89, 200);
		}else{
			numberGrid.numberGridArray[rowNum][columnNum].textColour = color(0,0,0);
		}

		numberGrid.numberGridArray[rowNum][columnNum].displayNumber = parseInt(character);
	}
	solveAttempts = 0;
}
function setup() {
	createCanvas(windowWidth - 4, windowHeight - 4);
	background(50, 89, 100);
	
	button = createButton('click me');
  	button.position(0, 0);
 	button.mousePressed(function(){startSolveCommand = true});
	textBox = createInput('057000008090600000000300107089020001100000004600010520705004000000005030200000750');
	textBox.position(0, 50);
	textBox.size(1000);
	textBox.input(textBoxTyping);
	console.log(textBox)

	numberGrid = new NumberGrid(width/2 - SUDOKU_SQUARE_SIZE*4.5, height*.25);
	graphicsItems = new GraphicsItems([
		numberGrid
	]);
}

function draw() {
	background(50, 89, 100);
	
	textAlign(CENTER);
	textSize(32);
	fill(255);
	text('Shitty Sudoku Solver', width/2, 30);
	//text(String(score_left), 30, height - 20);
	//text(String(score_right), width - 30, height - 20);
	//text(String(rally), width/2, height - 20);
	
	graphicsItems.run();
	checkInput();
	if (startSolveCommand){
		solveSudoku();
	}
}
function checkInput(){
	if (keyIsDown(UP_ARROW)) {
		//bumper_right.y_accel -= BUMPER_VERT_ACCEL;
	}
	if (keyIsDown(DOWN_ARROW)) {
		//bumper_right.y_accel += BUMPER_VERT_ACCEL;
	}
	if (keyIsDown(87)){
		//bumper_left.y_accel -= BUMPER_VERT_ACCEL;
	}
	if (keyIsDown(83)){
		//bumper_left.y_accel += BUMPER_VERT_ACCEL;
	}
	return false;
}
function windowResized() {
	setup();
}
