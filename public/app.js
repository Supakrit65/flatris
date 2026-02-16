const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');

const COLS = 10;
const ROWS = 20;
const BLOCK = canvas.width / COLS;

const COLORS = {
  I: '#3b82f6',
  J: '#0ea5e9',
  L: '#f59e0b',
  O: '#22c55e',
  S: '#14b8a6',
  T: '#8b5cf6',
  Z: '#ef4444'
};

const SHAPES = {
  I: [[1, 1, 1, 1]],
  J: [
    [1, 0, 0],
    [1, 1, 1]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1]
  ],
  O: [
    [1, 1],
    [1, 1]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1]
  ]
};

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function rotate(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const out = Array.from({ length: cols }, () => Array(rows).fill(0));

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      out[x][rows - 1 - y] = matrix[y][x];
    }
  }

  return out;
}

function randomType() {
  const keys = Object.keys(SHAPES);
  return keys[Math.floor(Math.random() * keys.length)];
}

function spawnPiece() {
  const type = randomType();
  const shape = SHAPES[type].map((row) => [...row]);
  return {
    type,
    shape,
    x: Math.floor((COLS - shape[0].length) / 2),
    y: 0
  };
}

function drawCell(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.strokeRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
}

function drawBoard(board) {
  ctx.fillStyle = '#fbfdff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (board[y][x]) {
        drawCell(x, y, board[y][x]);
      }
    }
  }
}

function drawPiece(piece) {
  for (let y = 0; y < piece.shape.length; y += 1) {
    for (let x = 0; x < piece.shape[y].length; x += 1) {
      if (piece.shape[y][x]) {
        drawCell(piece.x + x, piece.y + y, COLORS[piece.type]);
      }
    }
  }
}

function collides(board, piece) {
  for (let y = 0; y < piece.shape.length; y += 1) {
    for (let x = 0; x < piece.shape[y].length; x += 1) {
      if (!piece.shape[y][x]) continue;

      const newX = piece.x + x;
      const newY = piece.y + y;

      if (newX < 0 || newX >= COLS || newY >= ROWS) {
        return true;
      }

      if (newY >= 0 && board[newY][newX]) {
        return true;
      }
    }
  }

  return false;
}

function merge(board, piece) {
  for (let y = 0; y < piece.shape.length; y += 1) {
    for (let x = 0; x < piece.shape[y].length; x += 1) {
      if (piece.shape[y][x]) {
        board[piece.y + y][piece.x + x] = COLORS[piece.type];
      }
    }
  }
}

function clearLines(board) {
  let cleared = 0;

  for (let y = ROWS - 1; y >= 0; y -= 1) {
    if (board[y].every(Boolean)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(null));
      cleared += 1;
      y += 1;
    }
  }

  return cleared;
}

function updateScore(state, linesCleared) {
  if (!linesCleared) return;

  const points = [0, 100, 300, 500, 800];
  state.score += points[linesCleared] * state.level;
  state.lines += linesCleared;
  state.level = 1 + Math.floor(state.lines / 10);
  state.dropInterval = Math.max(120, 700 - (state.level - 1) * 60);
}

function hardDrop(state) {
  while (true) {
    state.piece.y += 1;
    if (collides(state.board, state.piece)) {
      state.piece.y -= 1;
      lockPiece(state);
      break;
    }
  }
}

function lockPiece(state) {
  merge(state.board, state.piece);
  const linesCleared = clearLines(state.board);
  updateScore(state, linesCleared);

  state.piece = spawnPiece();
  if (collides(state.board, state.piece)) {
    state.gameOver = true;
  }
}

function movePiece(state, dx) {
  state.piece.x += dx;
  if (collides(state.board, state.piece)) {
    state.piece.x -= dx;
  }
}

function softDrop(state) {
  state.piece.y += 1;
  if (collides(state.board, state.piece)) {
    state.piece.y -= 1;
    lockPiece(state);
  }
}

function rotatePiece(state) {
  const original = state.piece.shape;
  state.piece.shape = rotate(state.piece.shape);

  if (collides(state.board, state.piece)) {
    state.piece.x += 1;
    if (collides(state.board, state.piece)) {
      state.piece.x -= 2;
      if (collides(state.board, state.piece)) {
        state.piece.x += 1;
        state.piece.shape = original;
      }
    }
  }
}

function render(state) {
  drawBoard(state.board);
  if (!state.gameOver) {
    drawPiece(state.piece);
  }

  scoreEl.textContent = String(state.score);
  linesEl.textContent = String(state.lines);
  levelEl.textContent = String(state.level);

  if (state.gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px Helvetica Neue';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = '16px Helvetica Neue';
    ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 24);
  }
}

function createState() {
  return {
    board: createBoard(),
    piece: spawnPiece(),
    score: 0,
    lines: 0,
    level: 1,
    gameOver: false,
    dropInterval: 700,
    lastDrop: 0
  };
}

let state = createState();

function update(time = 0) {
  if (!state.gameOver && time - state.lastDrop > state.dropInterval) {
    softDrop(state);
    state.lastDrop = time;
  }

  render(state);
  requestAnimationFrame(update);
}

document.addEventListener('keydown', (event) => {
  if (event.code === 'KeyR') {
    state = createState();
    return;
  }

  if (state.gameOver) return;

  if (event.code === 'ArrowLeft') {
    movePiece(state, -1);
  } else if (event.code === 'ArrowRight') {
    movePiece(state, 1);
  } else if (event.code === 'ArrowDown') {
    softDrop(state);
  } else if (event.code === 'ArrowUp') {
    rotatePiece(state);
  } else if (event.code === 'Space') {
    hardDrop(state);
  }
});

update();
