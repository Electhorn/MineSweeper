let ctx;
let faceCtx;
let tileSize;
let faceCanvasEl;

function drawTileHidden(x, y) {
  const bevelSize = tileSize * 0.125;
  ctx.fillStyle = "#c0c0c0";
  ctx.fillRect(x, y, tileSize, tileSize);

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.moveTo(x, y + tileSize);
  ctx.lineTo(x, y);
  ctx.lineTo(x + tileSize, y);
  ctx.lineTo(x + tileSize - bevelSize, y + bevelSize);
  ctx.lineTo(x + bevelSize, y + bevelSize);
  ctx.lineTo(x + bevelSize, y + tileSize - bevelSize);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#7b7b7b";
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

function drawTileRevealed(x, y) {
  ctx.fillStyle = "#bdbdbd";
  ctx.fillRect(x, y, tileSize, tileSize);
  ctx.strokeStyle = "#7b7b7b";
  ctx.lineWidth = Math.max(0.5, tileSize * 0.05);
  const offset = ctx.lineWidth / 2;
  ctx.strokeRect(
    x + offset,
    y + offset,
    tileSize - ctx.lineWidth,
    tileSize - ctx.lineWidth
  );
}

function drawNumber(x, y, number) {
  drawTileRevealed(x, y);
  const colors = {
    1: "#0000FF",
    2: "#008000",
    3: "#FF0000",
    4: "#000080",
    5: "#800000",
    6: "#008080",
    7: "#000000",
    8: "#808080",
  };
  const fontSize = Math.floor(tileSize * 0.8);
  ctx.fillStyle = colors[number];
  ctx.font = `bold ${fontSize}px "W95FA", "MS Sans Serif", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(number, x + tileSize / 2, y + tileSize / 2 + 2);
}

function drawFlag(x, y) {
  drawTileHidden(x, y);
  const centerX = x + tileSize / 2;
  const centerY = y + tileSize / 2;

  ctx.strokeStyle = "black";
  ctx.lineWidth = tileSize * 0.125;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - tileSize * 0.3);
  ctx.lineTo(centerX, centerY + tileSize * 0.3);
  ctx.stroke();

  ctx.lineWidth = tileSize * 0.1875;
  ctx.beginPath();
  ctx.moveTo(centerX - tileSize * 0.2, centerY + tileSize * 0.3);
  ctx.lineTo(centerX + tileSize * 0.2, centerY + tileSize * 0.3);
  ctx.stroke();

  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - tileSize * 0.3);
  ctx.lineTo(centerX - tileSize * 0.35, centerY - tileSize * 0.15);
  ctx.lineTo(centerX, centerY);
  ctx.closePath();
  ctx.fill();
}

function drawQuestion(x, y) {
  drawTileHidden(x, y);
  const fontSize = Math.floor(tileSize * 0.9);
  ctx.fillStyle = "black";
  ctx.font = `bold ${fontSize}px "W95FA", "MS Sans Serif", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("?", x + tileSize / 2, y + tileSize / 2 + 2);
}

function drawMine(x, y, isClicked = false) {
  if (isClicked) {
    ctx.fillStyle = "red";
    ctx.fillRect(x, y, tileSize, tileSize);
  } else {
    drawTileRevealed(x, y);
  }
  const centerX = x + tileSize / 2;
  const centerY = y + tileSize / 2;
  const radius = tileSize * 0.3;

  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fill();

  ctx.strokeStyle = "black";
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

  ctx.fillStyle = "white";
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

function drawWrongFlag(x, y) {
  drawMine(x, y, false);
  ctx.strokeStyle = "red";
  ctx.lineWidth = tileSize * 0.125;
  const padding = tileSize * 0.125;
  ctx.beginPath();
  ctx.moveTo(x + padding, y + padding);
  ctx.lineTo(x + tileSize - padding, y + tileSize - padding);
  ctx.moveTo(x + tileSize - padding, y + padding);
  ctx.lineTo(x + padding, y + tileSize - padding);
  ctx.stroke();
}

function drawCell(cell, x, y, isGameOver) {
  if (isGameOver) {
    if (cell.isMine && !cell.isFlagged) {
      drawMine(x, y, cell.isRevealed);
    } else if (!cell.isMine && cell.isFlagged) {
      drawWrongFlag(x, y);
    } else if (cell.isFlagged) {
      drawFlag(x, y);
    } else if (cell.isRevealed) {
      drawNumber(x, y, cell.neighborMines);
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

export function initDrawing(mainCtx, smileyCtx, faceCanvasElement) {
  ctx = mainCtx;
  faceCtx = smileyCtx;
  faceCanvasEl = faceCanvasElement;
}

export function updateDrawSize(newTileSize) {
  tileSize = newTileSize;
}

export function drawBoard(board, isGameOver) {
  if (!ctx) return;
  const logicalWidth = ctx.canvas.width / (window.devicePixelRatio || 1);
  const logicalHeight = ctx.canvas.height / (window.devicePixelRatio || 1);
  ctx.clearRect(0, 0, Math.ceil(logicalWidth), Math.ceil(logicalHeight));

  const rows = board.length;
  if (rows === 0) return;
  const cols = board[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      const x = c * tileSize;
      const y = r * tileSize;
      drawCell(cell, x, y, isGameOver);
    }
  }
}

export function drawFace(state = "smile") {
  if (!faceCtx) return;

  const dpr = window.devicePixelRatio || 1;
  const w = faceCtx.canvas.width / dpr;
  const h = faceCtx.canvas.height / dpr;

  const centerX = w / 2;
  const centerY = h / 2;
  const radius = w * 0.35;

  const lineWidth = w / 30;

  faceCtx.clearRect(0, 0, w, h);

  if (faceCanvasEl.matches(":active")) {
    faceCtx.clearRect(0, 0, w, h);
  }

  faceCtx.beginPath();
  faceCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  faceCtx.fillStyle = "yellow";
  faceCtx.fill();
  faceCtx.strokeStyle = "black";
  faceCtx.lineWidth = lineWidth;
  faceCtx.stroke();

  switch (state) {
    case "win":
      const glassesWidth = radius * 1.8;
      const glassesHeight = radius * 0.45;
      const glassesX = centerX - glassesWidth / 2;
      const glassesY = centerY - h * 0.15;

      faceCtx.fillStyle = "black";
      faceCtx.fillRect(glassesX, glassesY, glassesWidth, glassesHeight);

      faceCtx.fillStyle = "rgba(255, 255, 255, 0.4)";
      faceCtx.fillRect(
        glassesX + glassesWidth * 0.15,
        glassesY + glassesHeight * 0.2,
        glassesWidth * 0.2,
        glassesHeight * 0.2
      );

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

      break;
      faceCtx.fillStyle = "black";
      faceCtx.beginPath();

      const topY = centerY - h * 0.15;
      const bottomOuterY = centerY + h * 0.08;
      const bottomInnerY = centerY - h * 0.02;
      const outerX = w * 0.35;
      const innerX = w * 0.12;

      faceCtx.moveTo(centerX - outerX, topY);
      faceCtx.lineTo(centerX + outerX, topY);
      faceCtx.lineTo(centerX + outerX, bottomOuterY);
      faceCtx.lineTo(centerX + innerX, bottomInnerY);
      faceCtx.lineTo(centerX - innerX, bottomInnerY);
      faceCtx.lineTo(centerX - outerX, bottomOuterY);
      faceCtx.closePath();
      faceCtx.fill();

      faceCtx.strokeStyle = "black";
      faceCtx.lineWidth = lineWidth * 0.9;
      faceCtx.beginPath();

      faceCtx.moveTo(centerX - outerX, topY);
      faceCtx.lineTo(centerX - outerX - w * 0.1, topY - h * 0.05);

      faceCtx.moveTo(centerX + outerX, topY);
      faceCtx.lineTo(centerX + outerX + w * 0.1, topY - h * 0.05);
      faceCtx.stroke();

      faceCtx.lineWidth = lineWidth;
      faceCtx.beginPath();

      faceCtx.arc(
        centerX,
        centerY + h * 0.15,
        radius * 0.5,
        0.15 * Math.PI,
        0.85 * Math.PI,
        false
      );
      faceCtx.stroke();

      break;

    case "lose":
      faceCtx.lineWidth = lineWidth;
      const eyeOffsetX = w * 0.12;
      const eyeOffsetY = h * 0.12;
      const eyeSize = w * 0.06;

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

      faceCtx.beginPath();
      faceCtx.arc(centerX, centerY + h * 0.25, radius * 0.5, 0, Math.PI, true);
      faceCtx.stroke();
      break;

    case "surprise":
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

      faceCtx.lineWidth = lineWidth;
      faceCtx.beginPath();
      faceCtx.arc(centerX, centerY + h * 0.1, radius * 0.3, 0, 2 * Math.PI);
      faceCtx.stroke();
      break;

    case "smile":
    default:
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

      faceCtx.lineWidth = lineWidth;
      faceCtx.beginPath();
      faceCtx.arc(centerX, centerY + h * 0.05, radius * 0.5, 0, Math.PI, false);
      faceCtx.stroke();
      break;
  }
}
