// Drawing context and configuration
let ctx;
let faceCtx;
let tileSize;
let faceCanvasEl;

// Constants for better maintainability
const TILE_COLORS = {
  HIDDEN_BG: "#c0c0c0",
  HIDDEN_HIGHLIGHT: "white",
  HIDDEN_SHADOW: "#7b7b7b",
  REVEALED_BG: "#bdbdbd",
  REVEALED_BORDER: "#7b7b7b",
};

const NUMBER_COLORS = {
  1: "#0000FF",
  2: "#008000",
  3: "#FF0000",
  4: "#000080",
  5: "#800000",
  6: "#008080",
  7: "#000000",
  8: "#808080",
};

const MINE_COLORS = {
  BODY: "black",
  DETAIL: "white",
  CLICKED_BG: "red",
  WRONG_FLAG: "red",
};

/**
 * Draws a hidden tile with 3D effect
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
function drawTileHidden(x, y) {
  if (!ctx) return;

  const bevelSize = tileSize * 0.125;

  // Draw base
  ctx.fillStyle = TILE_COLORS.HIDDEN_BG;
  ctx.fillRect(x, y, tileSize, tileSize);

  // Draw highlight
  ctx.fillStyle = TILE_COLORS.HIDDEN_HIGHLIGHT;
  ctx.beginPath();
  ctx.moveTo(x, y + tileSize);
  ctx.lineTo(x, y);
  ctx.lineTo(x + tileSize, y);
  ctx.lineTo(x + tileSize - bevelSize, y + bevelSize);
  ctx.lineTo(x + bevelSize, y + bevelSize);
  ctx.lineTo(x + bevelSize, y + tileSize - bevelSize);
  ctx.closePath();
  ctx.fill();

  // Draw shadow
  ctx.fillStyle = TILE_COLORS.HIDDEN_SHADOW;
  ctx.beginPath();
  ctx.moveTo(x, y + tileSize);
  ctx.lineTo(x + tileSize, y + tileSize);
  ctx.lineTo(x + tileSize, y);
  ctx.lineTo(x + tileSize - bevelSize, y + bevelSize);
  ctx.lineTo(x + tileSize - bevelSize, y + tileSize - bevelSize);
  ctx.lineTo(x + bevelSize, y + tileSize - bevelSize);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draws a revealed tile
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
function drawTileRevealed(x, y) {
  if (!ctx) return;

  ctx.fillStyle = TILE_COLORS.REVEALED_BG;
  ctx.fillRect(x, y, tileSize, tileSize);

  ctx.strokeStyle = TILE_COLORS.REVEALED_BORDER;
  ctx.lineWidth = Math.max(0.5, tileSize * 0.05);
  const offset = ctx.lineWidth / 2;
  ctx.strokeRect(
    x + offset,
    y + offset,
    tileSize - ctx.lineWidth,
    tileSize - ctx.lineWidth
  );
}

/**
 * Draws a numbered tile
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} number - Number to display (1-8)
 */
function drawNumber(x, y, number) {
  if (!ctx) return;

  drawTileRevealed(x, y);

  const color = NUMBER_COLORS[number];
  if (!color) return;

  const fontSize = Math.floor(tileSize * 0.8);
  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px "W95FA", "MS Sans Serif", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(number, x + tileSize / 2, y + tileSize / 2 + 2);
}

/**
 * Draws a flagged tile
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
function drawFlag(x, y) {
  if (!ctx) return;

  drawTileHidden(x, y);

  const centerX = x + tileSize / 2;
  const centerY = y + tileSize / 2;
  const flagWidth = tileSize * 0.35;
  const flagHeight = tileSize * 0.2;
  const poleWidth = tileSize * 0.125;
  const poleHeight = tileSize * 0.6;

  // Draw flag pole
  ctx.strokeStyle = "black";
  ctx.lineWidth = poleWidth;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - poleHeight / 2);
  ctx.lineTo(centerX, centerY + poleHeight / 2);
  ctx.stroke();

  // Draw flag base
  ctx.lineWidth = tileSize * 0.1875;
  ctx.beginPath();
  ctx.moveTo(centerX - tileSize * 0.2, centerY + tileSize * 0.3);
  ctx.lineTo(centerX + tileSize * 0.2, centerY + tileSize * 0.3);
  ctx.stroke();

  // Draw flag
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - poleHeight / 2);
  ctx.lineTo(centerX - flagWidth, centerY - poleHeight / 2 + flagHeight / 2);
  ctx.lineTo(centerX, centerY - poleHeight / 2 + flagHeight);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draws a question mark tile
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
function drawQuestion(x, y) {
  if (!ctx) return;

  drawTileHidden(x, y);

  const fontSize = Math.floor(tileSize * 0.9);
  ctx.fillStyle = "black";
  ctx.font = `bold ${fontSize}px "W95FA", "MS Sans Serif", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("?", x + tileSize / 2, y + tileSize / 2 + 2);
}

/**
 * Draws a mine
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {boolean} isClicked - Whether mine was clicked
 */
function drawMine(x, y, isClicked = false) {
  if (!ctx) return;

  if (isClicked) {
    ctx.fillStyle = MINE_COLORS.CLICKED_BG;
    ctx.fillRect(x, y, tileSize, tileSize);
  } else {
    drawTileRevealed(x, y);
  }

  const centerX = x + tileSize / 2;
  const centerY = y + tileSize / 2;
  const radius = tileSize * 0.3;

  // Draw mine body
  ctx.fillStyle = MINE_COLORS.BODY;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fill();

  // Draw spikes
  ctx.strokeStyle = MINE_COLORS.BODY;
  ctx.lineWidth = tileSize * 0.125;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(angle) * radius * 1.5,
      centerY + Math.sin(angle) * radius * 1.5
    );
    ctx.stroke();
  }

  // Draw highlight
  ctx.fillStyle = MINE_COLORS.DETAIL;
  ctx.beginPath();
  ctx.arc(
    centerX - radius * 0.4,
    centerY - radius * 0.4,
    radius * 0.2,
    0,
    2 * Math.PI
  );
  ctx.fill();
}

/**
 * Draws a wrongly flagged tile
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
function drawWrongFlag(x, y) {
  if (!ctx) return;

  drawMine(x, y, false);

  ctx.strokeStyle = MINE_COLORS.WRONG_FLAG;
  ctx.lineWidth = tileSize * 0.125;
  const padding = tileSize * 0.125;

  ctx.beginPath();
  ctx.moveTo(x + padding, y + padding);
  ctx.lineTo(x + tileSize - padding, y + tileSize - padding);
  ctx.moveTo(x + tileSize - padding, y + padding);
  ctx.lineTo(x + padding, y + tileSize - padding);
  ctx.stroke();
}

/**
 * Draws a cell based on its state
 * @param {Object} cell - Cell object
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {boolean} isGameOver - Whether game is over
 */
function drawCell(cell, x, y, isGameOver) {
  if (!ctx || !cell) return;

  if (isGameOver) {
    if (cell.isMine && !cell.isFlagged) {
      drawMine(x, y, cell.isRevealed);
    } else if (!cell.isMine && cell.isFlagged) {
      drawWrongFlag(x, y);
    } else if (cell.isFlagged) {
      drawFlag(x, y);
    } else if (cell.isRevealed) {
      if (cell.neighborMines > 0) {
        drawNumber(x, y, cell.neighborMines);
      } else {
        drawTileRevealed(x, y);
      }
    } else {
      drawTileHidden(x, y);
    }
  } else {
    if (cell.isRevealed) {
      if (cell.neighborMines > 0) {
        drawNumber(x, y, cell.neighborMines);
      } else {
        drawTileRevealed(x, y);
      }
    } else if (cell.isFlagged) {
      drawFlag(x, y);
    } else if (cell.isQuestion) {
      drawQuestion(x, y);
    } else {
      drawTileHidden(x, y);
    }
  }
}

/**
 * Initializes drawing contexts
 * @param {CanvasRenderingContext2D} mainCtx - Main canvas context
 * @param {CanvasRenderingContext2D} smileyCtx - Face canvas context
 * @param {HTMLCanvasElement} faceCanvasElement - Face canvas element
 */
export function initDrawing(mainCtx, smileyCtx, faceCanvasElement) {
  ctx = mainCtx;
  faceCtx = smileyCtx;
  faceCanvasEl = faceCanvasElement;
}

/**
 * Updates tile size
 * @param {number} newTileSize - New tile size
 */
export function updateDrawSize(newTileSize) {
  tileSize = newTileSize;
}

/**
 * Draws the game board
 * @param {Array} board - Game board array
 * @param {boolean} isGameOver - Whether game is over
 */
export function drawBoard(board, isGameOver) {
  if (!ctx || !board || !Array.isArray(board)) return;

  const dpr = window.devicePixelRatio || 1;
  const logicalWidth = ctx.canvas.width / dpr;
  const logicalHeight = ctx.canvas.height / dpr;

  ctx.clearRect(0, 0, Math.ceil(logicalWidth), Math.ceil(logicalHeight));

  const rows = board.length;
  if (rows === 0) return;

  const cols = board[0].length;
  if (cols === 0) return;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (cell) {
        const x = c * tileSize;
        const y = r * tileSize;
        drawCell(cell, x, y, isGameOver);
      }
    }
  }
}

/**
 * Draws the face button
 * @param {string} state - Face state ("smile", "win", "lose", "surprise")
 */
export function drawFace(state = "smile") {
  if (!faceCtx || !faceCanvasEl) return;

  const dpr = window.devicePixelRatio || 1;
  const w = faceCtx.canvas.width / dpr;
  const h = faceCtx.canvas.height / dpr;

  const centerX = w / 2;
  const centerY = h / 2;
  const radius = w * 0.35;
  const lineWidth = w / 30;

  // Clear canvas
  faceCtx.clearRect(0, 0, w, h);

  // Draw face base
  faceCtx.beginPath();
  faceCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  faceCtx.fillStyle = "yellow";
  faceCtx.fill();
  faceCtx.strokeStyle = "black";
  faceCtx.lineWidth = lineWidth;
  faceCtx.stroke();

  // Draw face based on state
  switch (state) {
    case "win":
      drawWinFace(centerX, centerY, w, h, radius, lineWidth);
      break;
    case "lose":
      drawLoseFace(centerX, centerY, w, h, radius, lineWidth);
      break;
    case "surprise":
      drawSurpriseFace(centerX, centerY, w, h, radius);
      break;
    case "smile":
    default:
      drawSmileFace(centerX, centerY, w, h, radius);
      break;
  }
}

/**
 * Draws the winning face
 */
function drawWinFace(centerX, centerY, w, h, radius, lineWidth) {
  if (!faceCtx) return;

  const glassesWidth = radius * 1.8;
  const glassesHeight = radius * 0.45;
  const glassesX = centerX - glassesWidth / 2;
  const glassesY = centerY - h * 0.15;

  // Draw glasses frame
  faceCtx.fillStyle = "black";
  faceCtx.fillRect(glassesX, glassesY, glassesWidth, glassesHeight);

  // Draw glasses reflection
  faceCtx.fillStyle = "rgba(255, 255, 255, 0.4)";
  faceCtx.fillRect(
    glassesX + glassesWidth * 0.15,
    glassesY + glassesHeight * 0.2,
    glassesWidth * 0.2,
    glassesHeight * 0.2
  );

  // Draw glasses arms
  faceCtx.strokeStyle = "black";
  faceCtx.lineWidth = lineWidth * 0.7;
  faceCtx.beginPath();
  faceCtx.moveTo(glassesX, glassesY + glassesHeight * 0.5);
  faceCtx.lineTo(glassesX - w * 0.1, glassesY + glassesHeight * 0.2);
  faceCtx.moveTo(glassesX + glassesWidth, glassesY + glassesHeight * 0.5);
  faceCtx.lineTo(
    glassesX + glassesWidth + w * 0.1,
    glassesY + glassesHeight * 0.2
  );
  faceCtx.stroke();

  // Draw smile
  faceCtx.lineWidth = lineWidth;
  faceCtx.beginPath();
  faceCtx.arc(
    centerX,
    centerY + h * 0.12,
    radius * 0.6,
    0.1 * Math.PI,
    0.9 * Math.PI,
    false
  );
  faceCtx.stroke();
}

/**
 * Draws the losing face
 */
function drawLoseFace(centerX, centerY, w, h, radius, lineWidth) {
  if (!faceCtx) return;

  const eyeOffsetX = w * 0.12;
  const eyeOffsetY = h * 0.12;
  const eyeSize = w * 0.06;

  // Draw X eyes
  faceCtx.beginPath();
  faceCtx.moveTo(
    centerX - eyeOffsetX - eyeSize,
    centerY - eyeOffsetY - eyeSize
  );
  faceCtx.lineTo(
    centerX - eyeOffsetX + eyeSize,
    centerY - eyeOffsetY + eyeSize
  );
  faceCtx.moveTo(
    centerX - eyeOffsetX + eyeSize,
    centerY - eyeOffsetY - eyeSize
  );
  faceCtx.lineTo(
    centerX - eyeOffsetX - eyeSize,
    centerY - eyeOffsetY + eyeSize
  );
  faceCtx.moveTo(
    centerX + eyeOffsetX - eyeSize,
    centerY - eyeOffsetY - eyeSize
  );
  faceCtx.lineTo(
    centerX + eyeOffsetX + eyeSize,
    centerY - eyeOffsetY + eyeSize
  );
  faceCtx.moveTo(
    centerX + eyeOffsetX + eyeSize,
    centerY - eyeOffsetY - eyeSize
  );
  faceCtx.lineTo(
    centerX + eyeOffsetX - eyeSize,
    centerY - eyeOffsetY + eyeSize
  );
  faceCtx.stroke();

  // Draw frown
  faceCtx.beginPath();
  faceCtx.arc(centerX, centerY + h * 0.25, radius * 0.5, 0, Math.PI, true);
  faceCtx.stroke();
}

/**
 * Draws the surprised face
 */
function drawSurpriseFace(centerX, centerY, w, h, radius) {
  if (!faceCtx) return;

  // Draw surprised eyes
  faceCtx.fillStyle = "black";
  faceCtx.beginPath();
  faceCtx.arc(
    centerX - w * 0.12,
    centerY - h * 0.1,
    radius * 0.25,
    0,
    2 * Math.PI
  );
  faceCtx.fill();
  faceCtx.beginPath();
  faceCtx.arc(
    centerX + w * 0.12,
    centerY - h * 0.1,
    radius * 0.25,
    0,
    2 * Math.PI
  );
  faceCtx.fill();

  // Draw open mouth
  faceCtx.lineWidth = w / 30;
  faceCtx.beginPath();
  faceCtx.arc(centerX, centerY + h * 0.1, radius * 0.3, 0, 2 * Math.PI);
  faceCtx.stroke();
}

/**
 * Draws the smiling face
 */
function drawSmileFace(centerX, centerY, w, h, radius) {
  if (!faceCtx) return;

  // Draw eyes
  faceCtx.fillStyle = "black";
  faceCtx.beginPath();
  faceCtx.arc(
    centerX - w * 0.12,
    centerY - h * 0.1,
    radius * 0.15,
    0,
    2 * Math.PI
  );
  faceCtx.fill();
  faceCtx.beginPath();
  faceCtx.arc(
    centerX + w * 0.12,
    centerY - h * 0.1,
    radius * 0.15,
    0,
    2 * Math.PI
  );
  faceCtx.fill();

  // Draw smile
  faceCtx.lineWidth = w / 30;
  faceCtx.beginPath();
  faceCtx.arc(centerX, centerY + h * 0.05, radius * 0.5, 0, Math.PI, false);
  faceCtx.stroke();
}
