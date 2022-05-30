let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let lines = 0;
let gameOver = false;
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const arena = createMatrix(12,20);
const colors = [
    null,
    'red',
    'blue',
    'green',
    'orange',
    'grey',
    'purple',
    'white',
]

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
}

context.scale(27, 29);

/////////////////////////////// Tetromino's ///////////////////////////////
function createPiece(type) {
    if (type === 't') {
        return [
            [0,1,0],
            [1,1,1],
            [0,0,0],
        ]
    } else if (type === 'i') {
        return [
            [0,0,2,0],
            [0,0,2,0],
            [0,0,2,0],
            [0,0,2,0],
        ]
    } else if (type === 'o') {
        return [
            [3,3],
            [3,3],
        ]
    } else if (type === 's') {
        return [
            [0,4,4],
            [4,4,0],
            [0,0,0],
        ]
    } else if (type === 'z') {
        return [
            [5,5,0],
            [0,5,5],
            [0,0,0],
        ]
    } else if (type === 'j') {
        return [
            [0,6,0],
            [0,6,0],
            [6,6,0],
        ]
    } else if (type === 'l') {
        return [
            [0,7,0],
            [0,7,0],
            [0,7,7],
        ]
    }
}
document.addEventListener("DOMContentLoaded", () => ModalWindow.init());



/////////////////////////////// updates the score and the lines on the screen ///////////////////////////////
function updateScore() {
    document.getElementById('score').innerText = "SCORE: " + player.score;
}
function updateLines() {
    document.getElementById('lines').innerText = "LINES: " + lines;
}

function updateHighScore() {
    document.getElementById('high-score').innerText = 'HIGH-SCORE: ' + localStorage.getItem('high-score');
}


/////////////////////////////// When a row is complete, this function remove's that row ///////////////////////////////
function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length -1; y > 0; y--) {
        for (x = 0; x < arena[y].length; x++) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        lines++;
        y++
        player.score += rowCount * 10;
        rowCount *= 2;
        updateScore();
        updateLines();
    }
}

/////////////////////////////// Reset's the tetromino back to the top, when the tetromino hits the bottom or another piece ///////////////////////////////
function playerReset() {
    const pieces = 'tioljsz';
    player.matrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        gameOver = true;
        updateScore();
        updateLines()
        const hs = player.score > localStorage.getItem('high-score') ? player.score : localStorage.getItem('high-score');
        localStorage.setItem('high-score', hs)
        ModalWindow.openMedia({ title: 'GAME OVER!', content: 'Would you like to play again?' }); 
    }
}


/////////////////////////////// Rotate's the tetromino ///////////////////////////////
function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, dir);
            player.pos.x = pos;
            return;
        }
    }
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < y; x++) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ]
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

/////////////////////////////// stops the tetromino from going off grid ///////////////////////////////
function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

/////////////////////////////// Moves the tetromino down, and checks for a collision ///////////////////////////////
function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

/////////////////////////////// Draws the arena ///////////////////////////////
function createMatrix(w, h) {
    const matrix = [];
    while(h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

/////////////////////////////// Freeze's the tetromino's that hit the bottom, or another piece ///////////////////////////////
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        })
    })
}

/////////////////////////////// Checks to see if the tetromino has collided ///////////////////////////////
function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {
            if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}


/////////////////////////////// Draws the game board ///////////////////////////////
function draw() {
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height)
    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);

}

/////////////////////////////// TIMER! ///////////////////////////////
function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }
    if(!gameOver) {
        draw();
        requestAnimationFrame(update);
    }
    if (lines >= 2) {
        dropInterval = 700;
    }
    if (lines >= 4) {
        dropInterval = 600;
    }
    if (lines >= 6) {
        dropInterval = 500;
    }
    if (lines >= 8) {
        dropInterval = 400;
    }
    if (lines >= 10) {
        dropInterval = 300;
    }
    
} 

/////////////////////////////// Draws tetromino ///////////////////////////////
function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        })
    })
}

const leftBtn = document.getElementById('left');
const rightBtn = document.getElementById('right');
const flipBtn = document.getElementById('flip');
const downBtn = document.getElementById('down');

document.addEventListener('click', event => {
    if (event.click === leftBtn) {
        playerMove(-1)
    } else if (event.keyCode === 39) {
        playerMove(1);
    } else if (event.keyCode === 40) {
        playerDrop();
    } else if (event.keyCode === 38) {
        playerRotate(1);
        if (collide(arena, player)) {
            playerRotate(-1);
        }
    }
})

document.addEventListener('keydown', event => {
    if (event.keyCode === 37) {
        playerMove(-1)
    } else if (event.keyCode === 39) {
        playerMove(1);
    } else if (event.keyCode === 40) {
        playerDrop();
    } else if (event.keyCode === 38) {
        playerRotate(1);
        if (collide(arena, player)) {
            playerRotate(-1);
        }
    }
})




/////////////////////////////// Starts the game ///////////////////////////////
const startBtn = document.getElementById('startBtn');

startBtn.onclick = function() {
    initialize();
}

function initialize() {
    arena.forEach(row => row.fill(0));
    gameOver = false;
    updateHighScore()
    player.score = 0;
    lines = 0;
    playerReset();
    updateScore();
    updateLines();
    update();
    dropInterval = 1000;
}


/////////////////////////////// Pop-up Modal ///////////////////////////////
const ModalWindow = {
    init() {
        document.body.addEventListener("click", e => {
            if (e.target.classList.contains("modal__close")) {
                this.closeModal(e.target);
            }
        });
    },
    getHtmlTemplate(modalOptions) {
        return `
        <div class="modal__overlay">
            <div class="modal__window">
                <div class="modal__titlebar">
                    <span class="modal__title">${modalOptions.title}</span>
                </div>
                <div class="modal__content">
                    ${modalOptions.content}
                    <button type="button" id="startBtn" onclick="initialize()" class="modal__close" material-icons>Yes</button>
                    <button class="modal__close material-icons">No</button>
                </div>
            </div>
        </div>
        `;
    },

    openMedia(modalOptions = {}) {
        modalOptions = Object.assign({
            title: 'Modal Title',
            content: 'Modal Content'
        }, modalOptions);

        const modalTemplate = this.getHtmlTemplate(modalOptions);
        document.body.insertAdjacentHTML("afterbegin", modalTemplate);
    },

    closeModal(closeButton) {
        const modalOverlay = closeButton.parentElement.parentElement.parentElement;
        document.body.removeChild(modalOverlay);
    }
};

/////////////////////////////// Puts the score and the lines on the board before the game starts ///////////////////////////////
updateLines();
updateScore();
updateHighScore()
