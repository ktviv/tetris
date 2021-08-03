
const REQUEST_ANIMATION_FRAME = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
const CANVAS = document.getElementById('canvas');
const CONTEXT = CANVAS.getContext('2d');
const BLOCK_SIZE = 20;
const CANVAS_SCALE_FACTOR = 30;
const PLAY_FIELD_SCALE_FACTOR = (2 * CANVAS_SCALE_FACTOR) / 3;
CANVAS.width  = BLOCK_SIZE * CANVAS_SCALE_FACTOR;
CANVAS.height = BLOCK_SIZE * CANVAS_SCALE_FACTOR;
const FPS = 60;
const INTERVAL = 1000 / FPS;
const BORDER_WIDTH = BLOCK_SIZE * 4;
const PLAY_AREA_WIDTH = PLAY_FIELD_SCALE_FACTOR * BLOCK_SIZE;
const PLAY_AREA_HEIGHT = PLAY_FIELD_SCALE_FACTOR * BLOCK_SIZE;
const SPRITE_BRICK = document.getElementById("sprite_brick");
const SPRITE_BLOCK = document.getElementById("sprite_block");
const TETROMINOS = new Array();
const TETROMINO_BLOCK_SIZE = 4;
const DROP_X = (BORDER_WIDTH + BLOCK_SIZE + (PLAY_AREA_WIDTH / 2)) - ((TETROMINO_BLOCK_SIZE / 2) * BLOCK_SIZE);
const DROP_Y = BORDER_WIDTH + BLOCK_SIZE;


var initialized = false;
var gameOver = false;
var paused = false;
var speed = 60;
var speedCounter = 1;
var pieceCounter = 0;
var score = 0;
var currentPiece = null;
var playField = null;
let now, delta;
let then = Date.now();
let sNow, sDelta;
let sThen = Date.now();

class Utils {

    static translateXY(xPos, yPos) {

        return Utils.translate(yPos, xPos, PLAY_FIELD_SCALE_FACTOR);
    }

    // translate 2d array indices to 1d array index
    static translate(row, column, rowSize) {

        return (row * rowSize) + column;
    }

    static randInt(min, max, positive) {

        let num;
        if (positive === false) {

            num = Math.floor(Math.random() * max) - min;
            num *= Math.floor(Math.random() * 2) === 1 ? 1 : -1;
        } else {

            num = Math.floor(Math.random() * max) + min;
        }
        return num;
    }

    static nextTetrominoIndex() {

        return Utils.randInt(0, TETROMINOS.length, true);
    }
}

class Tetramino {

    constructor(shapedId, shapeArray, currentRotation, xPos, yPos) {

        this.shapedId = shapedId;
        this.shapeArray = shapeArray;
        this.currentRotation = currentRotation;
        this.xPos = xPos;
        this.yPos = yPos;
    }

    moveLeft() {

        if (this.doesItFit((this.xPos - BLOCK_SIZE), this.yPos, this.currentRotation)) {

            this.clear();
            this.xPos = this.xPos - BLOCK_SIZE;
            this.draw();
        }
    }

    moveRight() {

        if (this.doesItFit((this.xPos + BLOCK_SIZE), this.yPos, this.currentRotation)) {

            this.clear();
            this.xPos = this.xPos + BLOCK_SIZE;
            this.draw();
        }
    }

    moveDown() {

        if (this.doesItFit(this.xPos, (this.yPos + BLOCK_SIZE), this.currentRotation)) {

            this.clear();
            this.yPos = this.yPos + BLOCK_SIZE;
            this.draw();
        } else {

            for (let i = 0;i < this.shapeArray.length;i ++) {

                if (this.shapeArray[i] == 1) {

                    var x = (i % TETROMINO_BLOCK_SIZE);
                    var y = (Math.floor(i / TETROMINO_BLOCK_SIZE));
                    var rotatedIndex = this.rotateXY(x, y, this.currentRotation);
                    var newXPos = this.xPos + ((rotatedIndex % TETROMINO_BLOCK_SIZE) * BLOCK_SIZE);
                    var newYPos = this.yPos + ((Math.floor(rotatedIndex / TETROMINO_BLOCK_SIZE))  * BLOCK_SIZE);
                    playField.playAreaArray[Utils.translateXY(((newXPos - BORDER_WIDTH - BLOCK_SIZE) / BLOCK_SIZE), (newYPos - BORDER_WIDTH - BLOCK_SIZE) / BLOCK_SIZE)] = 1;
                }
            }
            currentPiece.clear();
            playField.draw();
            playField.checkForLine();
            var index = Utils.nextTetrominoIndex();
            var tetromino = TETROMINOS[index];
            currentPiece = new Tetramino(tetromino.shapedId, tetromino.shapeArray, tetromino.currentRotation, tetromino.xPos, tetromino.yPos);
            currentPiece.draw();
            if (!currentPiece.doesItFit(currentPiece.xPos, (currentPiece.yPos + BLOCK_SIZE), currentPiece.currentRotation)) {

                gameOver = true;
                gameOverScreen();
            }
        }
    }

    rotate() {

        if (this.doesItFit(this.xPos, this.yPos, ((this.currentRotation + 1) % 4))) {

            this.clear();
            this.currentRotation = ((this.currentRotation + 1) % 4); // 4 for 4 rotations : 90, 180, 270 and 0
            this.draw();
        }
    }

    doesItFit(xPos, yPos, rotation) {

        for (let i = 0;i < this.shapeArray.length;i ++) {

            if (this.shapeArray[i] == 1) {

                var x = (i % TETROMINO_BLOCK_SIZE);
                var y = (Math.floor(i / TETROMINO_BLOCK_SIZE));
                var rotatedIndex = this.rotateXY(x, y, rotation);
                var newXPos = xPos + ((rotatedIndex % TETROMINO_BLOCK_SIZE) * BLOCK_SIZE);
                var newYPos = yPos + ((Math.floor(rotatedIndex / TETROMINO_BLOCK_SIZE))  * BLOCK_SIZE);
                if (playField.playAreaArray[Utils.translateXY(((newXPos - BORDER_WIDTH - BLOCK_SIZE) / BLOCK_SIZE), (newYPos - BORDER_WIDTH - BLOCK_SIZE) / BLOCK_SIZE)] == 1) {

                    return false;
                } else if (newXPos <= (BORDER_WIDTH) || newXPos >= (CANVAS.width - BORDER_WIDTH - BLOCK_SIZE)) {

                    return false;
                } else if (newYPos >= (CANVAS.height - BORDER_WIDTH - BLOCK_SIZE)) {

                    return false;
                }
            }
        }
        return true;
    }

    testRotation() {

        var _get = function(val) {

            return (val === 1) ? " \u2588 " : "   ";
        }

        console.log("currentShape");
        console.log("   0   1   2   3");
        console.log(unescape(" \u250C\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2510"));
        console.log("0\u2502" + _get(this.shapeArray[0]) + "\u2502" + _get(this.shapeArray[1]) + "\u2502" + _get(this.shapeArray[2]) + "\u2502" + _get(this.shapeArray[3]) + "\u2502");
        console.log(" \u251C\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2524");
        console.log("1\u2502" + _get(this.shapeArray[4]) + "\u2502" + _get(this.shapeArray[5]) + "\u2502" + _get(this.shapeArray[6]) + "\u2502" + _get(this.shapeArray[7]) + "\u2502");
        console.log(" \u251C\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2524");
        console.log("2\u2502" + _get(this.shapeArray[8]) + "\u2502" + _get(this.shapeArray[9]) + "\u2502" + _get(this.shapeArray[10]) + "\u2502" + _get(this.shapeArray[11]) + "\u2502");
        console.log(" \u251C\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2524");
        console.log("3\u2502" + _get(this.shapeArray[12]) + "\u2502" + _get(this.shapeArray[13]) + "\u2502" + _get(this.shapeArray[14]) + "\u2502" + _get(this.shapeArray[15]) + "\u2502");
        console.log(" \u2514\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2518");

        for (var rotation = 0; rotation < 4; rotation ++) {

            var rotatedShapeArray = [];
            for (let i = 0;i < this.shapeArray.length;i ++) {
                if (rotatedShapeArray[i] != 1) {
                    rotatedShapeArray[i] = 0;
                }
                if (this.shapeArray[i] == 1) {
                    var x = (i % TETROMINO_BLOCK_SIZE);
                    var y = (Math.floor(i / TETROMINO_BLOCK_SIZE));
                    var rotatedIndex = this.rotateXY(x, y, rotation);
                    rotatedShapeArray[rotatedIndex] = 1;
                }
            }
            console.log("Rotated shape (current rotation = " + rotation);
            console.log("   0   1   2   3");
            console.log(unescape(" \u250C\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2510"));
            console.log("0\u2502" + _get(rotatedShapeArray[0]) + "\u2502" + _get(rotatedShapeArray[1]) + "\u2502" + _get(rotatedShapeArray[2]) + "\u2502" + _get(rotatedShapeArray[3]) + "\u2502");
            console.log(" \u251C\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2524");
            console.log("1\u2502" + _get(rotatedShapeArray[4]) + "\u2502" + _get(rotatedShapeArray[5]) + "\u2502" + _get(rotatedShapeArray[6]) + "\u2502" + _get(rotatedShapeArray[7]) + "\u2502");
            console.log(" \u251C\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2524");
            console.log("2\u2502" + _get(rotatedShapeArray[8]) + "\u2502" + _get(rotatedShapeArray[9]) + "\u2502" + _get(rotatedShapeArray[10]) + "\u2502" + _get(rotatedShapeArray[11]) + "\u2502");
            console.log(" \u251C\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2524");
            console.log("3\u2502" + _get(rotatedShapeArray[12]) + "\u2502" + _get(rotatedShapeArray[13]) + "\u2502" + _get(rotatedShapeArray[14]) + "\u2502" + _get(rotatedShapeArray[15]) + "\u2502");
            console.log(" \u2514\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2518");
        }
    }

    rotateXY(x, y, rotation) {

        if (rotation === 0) {

            return (y * TETROMINO_BLOCK_SIZE) + x;
        } else if (rotation === 1) {

            return 12 + y - (x * TETROMINO_BLOCK_SIZE);
        } else if (rotation === 2) {

            return 15 - (y * TETROMINO_BLOCK_SIZE) - x;
        } else if (rotation === 3) {

            return 3 - y + (x * TETROMINO_BLOCK_SIZE);
        } else {

            return 0;
        }
    }

    draw() {

        for (let i = 0;i < this.shapeArray.length;i ++) {

            if (this.shapeArray[i] == 1) {

                var x = (i % TETROMINO_BLOCK_SIZE);
                var y = (Math.floor(i / TETROMINO_BLOCK_SIZE));
                var rotatedIndex = this.rotateXY(x, y, this.currentRotation);
                var newXPos = this.xPos + ((rotatedIndex % TETROMINO_BLOCK_SIZE) * BLOCK_SIZE);
                var newYPos = this.yPos + ((Math.floor(rotatedIndex / TETROMINO_BLOCK_SIZE))  * BLOCK_SIZE);
                CONTEXT.drawImage(SPRITE_BLOCK, newXPos, newYPos, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }

    clear() {

        for (let i = 0;i < this.shapeArray.length;i ++) {

            if (this.shapeArray[i] == 1) {

                var x = (i % TETROMINO_BLOCK_SIZE);
                var y = (Math.floor(i / TETROMINO_BLOCK_SIZE));
                var rotatedIndex = this.rotateXY(x, y, this.currentRotation);
                var newXPos = this.xPos + ((rotatedIndex % TETROMINO_BLOCK_SIZE) * BLOCK_SIZE);
                var newYPos = this.yPos + ((Math.floor(rotatedIndex / TETROMINO_BLOCK_SIZE))  * BLOCK_SIZE);
                CONTEXT.clearRect(newXPos, newYPos, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }
}

class PlayField {

    constructor(scaleFactor, widthPx, heightPx) {

        this.scaleFactor = scaleFactor;
        this.widthPx = widthPx;
        this.heightPx = heightPx;
        this.playAreaArray = [];
        this.initialize();
    }

    initialize() {

        for (let i = 0; i < this.scaleFactor; i ++) {

            for (let j = 0;j < this.scaleFactor; j ++) {

                this.playAreaArray[Utils.translateXY(j, i)] = 0;
            }
        }
    }

    draw() {

        for (let i = 0;i < this.playAreaArray.length; i++) {

            if (this.playAreaArray[i] == 1) {

                var x = (i % (this.heightPx / this.scaleFactor));
                var y = (Math.floor(i / (this.widthPx / this.scaleFactor)));
                var newXPos = BORDER_WIDTH + BLOCK_SIZE + (x * BLOCK_SIZE);
                var newYPos = BORDER_WIDTH + BLOCK_SIZE + (y * BLOCK_SIZE);
                CONTEXT.drawImage(SPRITE_BLOCK, newXPos, newYPos, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }

    clear(includeValues) {

        for (let i = 0;i < this.playAreaArray.length; i++) {

            if (this.playAreaArray[i] == 1) {

                if (includeValues) {

                    this.playAreaArray[i] = 0;
                }
                var x = (i % (this.heightPx / this.scaleFactor));
                var y = (Math.floor(i / (this.widthPx / this.scaleFactor)));
                var newXPos = BORDER_WIDTH + BLOCK_SIZE + (x * BLOCK_SIZE);
                var newYPos = BORDER_WIDTH + BLOCK_SIZE + (y * BLOCK_SIZE);
                CONTEXT.clearRect(newXPos, newYPos, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }

    checkForLine() {

        var linesToClear = [];
        for (let y = 0; y < this.scaleFactor; y ++) {

            var count = 0;
            for (let x = 0;x < this.scaleFactor; x ++) {

                if (this.playAreaArray[Utils.translateXY(x, y)] == 1) {

                    count++;
                }
            }
            if (count === this.scaleFactor) {

                this.clearLine(y);
                linesToClear.push(y);
            }
            count = 0;
        }
        if (linesToClear.length > 0) {

            this.clearArrayLine(linesToClear);
            this.draw();
            score += 100 * speedCounter * linesToClear.length;
            if (score >= (500 * speedCounter * 2)) {

                speedCounter++;
            }
            this.drawScore(score);
            this.drawLevel();
        }
    }

    drawScore(score) {

        CONTEXT.clearRect(BORDER_WIDTH + 3 * BLOCK_SIZE, BLOCK_SIZE, 2 * BLOCK_SIZE, BLOCK_SIZE);
        CONTEXT.fillText("SCORE : " + score, BORDER_WIDTH, 2 * BLOCK_SIZE);
    }

    drawLevel() {

        CONTEXT.clearRect(CANVAS.width - BORDER_WIDTH - BLOCK_SIZE, BLOCK_SIZE, 2 * BLOCK_SIZE, BLOCK_SIZE);
        CONTEXT.fillText("LEVEL : " + speedCounter, CANVAS.width - BORDER_WIDTH - 4 * BLOCK_SIZE, 2 * BLOCK_SIZE);
    }

    clearLine(y) {

        this.clear(false);
    }

    clearArrayLine(linesToClear) {

        for (let y = 0;y < linesToClear.length; y ++) {

            this.playAreaArray.splice((linesToClear[y] * BLOCK_SIZE), this.scaleFactor);
            for (let x = 0;x < this.scaleFactor; x ++) {

                this.playAreaArray.unshift(0);
            }
        }
    }
}

function draw() {

  if (!initialized) {

    initialize();
    initialized = true;
  }

  if (!gameOver && initialized) {

    animation = REQUEST_ANIMATION_FRAME(draw);
    now   = Date.now();
    delta = now - then;
    if (delta > INTERVAL) {

        then = now - (delta % INTERVAL);
        runGame();
    }
  }
}

function gameOverScreen() {

    var count = 0;

    var intervalId = setInterval(function() {

        if (count < playField.playAreaArray.length) {

            var x = (count % (playField.heightPx / playField.scaleFactor));
            var y = (Math.floor(count / (playField.widthPx / playField.scaleFactor)));
            var newXPos = BORDER_WIDTH + BLOCK_SIZE + (x * BLOCK_SIZE);
            var newYPos = BORDER_WIDTH + BLOCK_SIZE + (y * BLOCK_SIZE);
            CONTEXT.drawImage(SPRITE_BLOCK, newXPos, newYPos, BLOCK_SIZE, BLOCK_SIZE);
            count++;
        } else {

            clearInterval(intervalId);
            CONTEXT.clearRect(BORDER_WIDTH + BLOCK_SIZE, BORDER_WIDTH + BLOCK_SIZE, 20 * BLOCK_SIZE, 20 * BLOCK_SIZE);

            CONTEXT.font = "30px Consolas";
            var gradient = CONTEXT.createLinearGradient(0, 0, 6*BLOCK_SIZE, 0);
            gradient.addColorStop("0", "orange");
            gradient.addColorStop("0.5", "yellow");
            gradient.addColorStop("1.0", "red");

            CONTEXT.fillStyle = gradient;
            CONTEXT.textAlign = "center";
            CONTEXT.fillText("GAME OVER", CANVAS.width / 2, CANVAS.height / 2);
            setTimeout(function() {

                reset();
            }, 3000);
        }
    }, 5);
}

function reset() {

    CONTEXT.clearRect(0, 0, CANVAS.width, CANVAS.height);
    TETROMINOS.splice(0, TETROMINOS.length);
    initialized = false;
    paused = false;
    speed = 60;
    speedCounter = 1;
    pieceCounter = 0;
    score = 0;
    currentPiece = null;
    playField = null;
    then = Date.now();
    sThen = Date.now();
    gameOver = false;
    draw();
}

function initialize() {

    drawBoundary();
    initializePlayField();
    initializeTetrominos();
    var index = Utils.nextTetrominoIndex();
    var tetromino = TETROMINOS[index];
    currentPiece = new Tetramino(tetromino.shapedId, tetromino.shapeArray, tetromino.currentRotation, tetromino.xPos, tetromino.yPos);
    currentPiece.draw();
}

function drawBoundary() {

    var _drawBlock = function(xPos, yPos, width, height) {

        CONTEXT.drawImage(SPRITE_BRICK, xPos, yPos, width, height);
    }
    var bricks = 0;
    var xPos = 0;
    var yPos = 0;
    bricks = (PLAY_AREA_WIDTH / BLOCK_SIZE) + 2;
    for (let i = 0;i < bricks;i ++) {
        //draw horizontal borders
        if (i < bricks) {

            xPos = BORDER_WIDTH + (i * BLOCK_SIZE);
            _drawBlock(xPos, BORDER_WIDTH, BLOCK_SIZE, BLOCK_SIZE);

           yPos = CANVAS.height - BORDER_WIDTH - BLOCK_SIZE;
           _drawBlock(xPos, yPos, BLOCK_SIZE, BLOCK_SIZE);
        }
        //draw vertical borders
        if (i > 0 && i <= (bricks - 2)) {

           yPos = BORDER_WIDTH + (i * BLOCK_SIZE);
           _drawBlock(BORDER_WIDTH, yPos, BLOCK_SIZE, BLOCK_SIZE);

           xPos = CANVAS.width - BORDER_WIDTH - BLOCK_SIZE;
           _drawBlock(xPos, yPos, BLOCK_SIZE, BLOCK_SIZE);
        }
    }
}

function initializePlayField() {

    playField = new PlayField(PLAY_FIELD_SCALE_FACTOR, PLAY_AREA_WIDTH, PLAY_AREA_HEIGHT);

    CONTEXT.font = "15px Consolas";
    var gradient = CONTEXT.createLinearGradient(0, 0, PLAY_AREA_WIDTH, 0);
    gradient.addColorStop("0", "orange");
    gradient.addColorStop("0.5", "yellow");
    gradient.addColorStop("1.0", "white");

    CONTEXT.fillStyle = gradient;
    CONTEXT.textAlign = "start";
    CONTEXT.fillText("MOVE-ARROW KEYS  ROTATE-Z  PAUSE-P  RESET-R", BORDER_WIDTH, CANVAS.height - BORDER_WIDTH + 2*BLOCK_SIZE);
    CONTEXT.fillText("SCORE : " + score, BORDER_WIDTH, 2 * BLOCK_SIZE);
    CONTEXT.fillText("LEVEL : " + speedCounter, CANVAS.width - BORDER_WIDTH - 4 * BLOCK_SIZE, 2 * BLOCK_SIZE);
}



function initializeTetrominos() {

    /*
        _ _ # _
        _ _ # _
        _ _ # _
        _ _ # _
    */
    TETROMINOS.push(new Tetramino(1, [0, 0, 1, 0 ,0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0], 0, DROP_X, DROP_Y));
    /*
        _ _ # _
        _ # # _
        _ _ # _
        _ _ _ _
    */
    TETROMINOS.push(new Tetramino(2, [0, 0, 1, 0 ,0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0], 0, DROP_X, DROP_Y));
    /*
        _ # _ _
        _ # _ _
        _ # # _
        _ _ _ _
    */
    TETROMINOS.push(new Tetramino(3, [0, 1, 0, 0 ,0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0], 0, DROP_X, DROP_Y));
    /*
        _ _ # _
        _ _ # _
        _ # # _
        _ _ _ _
    */
    TETROMINOS.push(new Tetramino(4, [0, 0, 1, 0 ,0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0], 0, DROP_X, DROP_Y));
    /*
        _ _ # _
        _ # # _
        _ # _ _
        _ _ _ _
    */
    TETROMINOS.push(new Tetramino(5, [0, 0, 1, 0 ,0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0], 0, DROP_X, DROP_Y));
    /*
        _ # _ _
        _ # # _
        _ _ # _
        _ _ _ _
    */
    TETROMINOS.push(new Tetramino(6, [0, 1, 0, 0 ,0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0], 0, DROP_X, DROP_Y));
    /*
        _ _ _ _
        _ # # _
        _ # # _
        _ _ _ _
    */
    TETROMINOS.push(new Tetramino(7, [0, 0, 0, 0 ,0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0], 0, DROP_X, DROP_Y));
}

function runGame() { // this function will be called at the speed of FPS

    sNow   = Date.now();
    sDelta = sNow - sThen;
    if ((sDelta > INTERVAL * speed / speedCounter) && !paused) {

        sThen = sNow - (sDelta % (INTERVAL * speed / speedCounter));
        gameSpeedTick();
    }
}

function gameSpeedTick() {

    currentPiece.moveDown();
}

Promise.all(Array.from(document.images).filter(img => !img.complete).map(img => new Promise(resolve => { img.onload = img.onerror = resolve; }))).then(() => {
    draw();
});


window.onkeydown = function(event) {

    if (event.keyCode === 37) { // arrow left

        currentPiece.moveLeft();
    } else if (event.keyCode === 39) { // arrow right

        currentPiece.moveRight();
    } else if (event.keyCode === 40) { // arrow down

        currentPiece.moveDown();
    } else if (event.keyCode === 90 || event.keyCode === 122) { //Z or z

        currentPiece.rotate();
    } else if (event.keyCode === 114 || event.keyCode === 82) { //r or R

        reset();
    } else if (event.keyCode === 112 || event.keyCode === 80) { //p or P

        paused = !paused;
    }
    event.preventDefault();
}




