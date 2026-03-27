
//board
let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

//bird
let birdWidth = 34; //width/height ratio = 408/228 = 17/12
let birdHeight = 24;
let birdX = boardWidth/8;
let birdY = boardHeight/2;
let birdImg;

let bird = {
    x : birdX,
    y : birdY,
    width : birdWidth,
    height : birdHeight
}

//pipes
let pipeArray = [];
let pipeWidth = 64; //width/height ratio = 384/3072 = 1/8
let pipeHeight = 512;
let pipeX = boardWidth + pipeWidth; //spawn pipes off-screen to the right
let pipeY = 0;

let pipeGap = 180; // horizontal gap between pipe sets

let topPipeImg;
let bottomPipeImg;

//physics
let speed = 6;
let velocityY = 0; //bird jump speed
let gravity = 0.4;
let lastTime = 0;

const maxUpAngle = -25 * Math.PI / 180;   // -25 degrees
const maxDownAngle = 90 * Math.PI / 180;  // 90 degrees

// game state
let gameOver = false;
let score = 0;

// media
const sfxPath = {
    die: "./sfx_die.wav",
    hit: "./sfx_hit.wav",
    point: "./sfx_point.wav",
    swoosh: "./sfx_swooshing.wav",
    wing: "./sfx_wing.wav"
};

function playSFX(path) {
    const sound = new Audio(path);
    sound.play();
    // When sound ends, remove reference
    sound.addEventListener("ended", () => {
        // Helps GC clean up
        sound.src = "";
    });
}

window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); //used for drawing on the board

    //draw flappy bird
    // context.fillStyle = "green";
    // context.fillRect(bird.x, bird.y, bird.width, bird.height);

    //load images
    birdImg = new Image();
    birdImg.src = "./flappybird.png";
    birdImg.onload = function() {
        context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    }

    topPipeImg = new Image();
    topPipeImg.src = "./toppipe.png";

    bottomPipeImg = new Image();
    bottomPipeImg.src = "./bottompipe.png";

    placePipes();

    requestAnimationFrame(update);
    document.addEventListener("keydown", moveBird);
}

function drawBird() {
    // map velocityY to angle
    let angle = velocityY * 5 * Math.PI / 180; // tweak multiplier to feel good
    angle = Math.min(Math.max(angle, maxUpAngle), maxDownAngle);

    // save current context
    context.save();

    // translate to bird center
    context.translate(bird.x + bird.width/2, bird.y + bird.height/2);
    context.rotate(angle);

    // draw the bird centered at (0,0)
    context.drawImage(birdImg, -bird.width/2, -bird.height/2, bird.width, bird.height);

    // restore context
    context.restore();
}

function update(currentTime) {
    requestAnimationFrame(update);
    if (gameOver) return;

    context.clearRect(0, 0, board.width, board.height);

    if (lastTime === 0 || currentTime - lastTime > 200) {
        lastTime = currentTime;
    }

    const deltaTime = (currentTime - lastTime) / 1000 * 60;  
    lastTime = currentTime;

    // bird physics
    velocityY += gravity * deltaTime;
    bird.y = Math.max(bird.y + velocityY, 0);
    drawBird();

    if (bird.y > board.height) gameOver = true;

    // Spawn new pipes if the last one has moved enough
    if (pipeArray.length === 0 || pipeArray[pipeArray.length-1].x < boardWidth + pipeWidth - pipeGap) {
        placePipes();
    }

    // move pipes
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x -= speed * deltaTime;
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

        if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            score += 0.5;
            pipe.passed = true;
        }

        if (detectCollision(bird, pipe)) {
            gameOver = true;
            playSFX(sfxPath.hit);
        }
    }

    // remove off-screen pipes
    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) pipeArray.shift();

    // draw score
    context.fillStyle = "white";
    context.font = "45px sans-serif";
    context.fillText(score, 5, 45);

    if (gameOver) context.fillText("GAME OVER", 5, 90);
}

function placePipes() {
    if (gameOver) {
        return;
    }

    //(0-1) * pipeHeight/2.
    // 0 -> -128 (pipeHeight/4)
    // 1 -> -128 - 256 (pipeHeight/4 - pipeHeight/2) = -3/4 pipeHeight
    let randomPipeY = pipeY - pipeHeight/4 - Math.random()*(pipeHeight/2);
    let openingSpace = board.height/4;

    let topPipe = {
        img : topPipeImg,
        x : pipeX,
        y : randomPipeY,
        width : pipeWidth,
        height : pipeHeight,
        passed : false
    }
    pipeArray.push(topPipe);

    let bottomPipe = {
        img : bottomPipeImg,
        x : pipeX,
        y : randomPipeY + pipeHeight + openingSpace,
        width : pipeWidth,
        height : pipeHeight,
        passed : false
    }
    pipeArray.push(bottomPipe);
}

function moveBird(e) {
    if (e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyX") {
        //jump
        velocityY = -6;
        playSFX(sfxPath.wing);

        //reset game
        if (gameOver) {
            bird.y = birdY;
            pipeArray = [];
            score = 0;
            gameOver = false;
            lastTime = 0;
            placePipes(); // else will spawn immediately
        }
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&   //a's top left corner doesn't reach b's top right corner
           a.x + a.width > b.x &&   //a's top right corner passes b's top left corner
           a.y < b.y + b.height &&  //a's top left corner doesn't reach b's bottom left corner
           a.y + a.height > b.y;    //a's bottom left corner passes b's top left corner
}
