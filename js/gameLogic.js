import state from "./state.js";
import { GAME_STATE, settings } from "./config.js";

function _shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function initBoard() {
  const config = state.getGameConfig();
  if (!config) return;

  const newBoard = [];
  for (let r = 0; r < config.rows; r++) {
    let row = [];
    for (let c = 0; c < config.cols; c++) {
      row.push({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        isQuestion: false,
        neighborMines: 0,
      });
    }
    newBoard.push(row);
  }
  state.setBoard(newBoard);
}

export function popMines(safeR, safeC) {
  const config = state.getGameConfig();
  if (!config) return [];

  const { rows, cols, mineCount } = config;
  const totalCells = rows * cols;
  let useSafeZone = true;

  if (mineCount > totalCells - 9) {
    console.warn(
      "Demasiadas minas. No se puede garantizar un área de inicio segura."
    );
    useSafeZone = false;
  }

  const potentialMineCoords = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (useSafeZone && Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) {
        continue;
      }
      potentialMineCoords.push({ r, c });
    }
  }

  _shuffleArray(potentialMineCoords);

  const mineLocations = potentialMineCoords.slice(0, mineCount);

  mineLocations.forEach(({ r, c }) => {
    state.getCell(r, c).isMine = true;
  });

  return mineLocations;
}

export function calcNeighbor(mineLocations) {
  if (!state.getGameConfig()) return;

  mineLocations.forEach(({ r: mineR, c: mineC }) => {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;

        const nr = mineR + dr;
        const nc = mineC + dc;

        const neighborCell = state.getCell(nr, nc);

        if (neighborCell && !neighborCell.isMine) {
          neighborCell.neighborMines++;
        }
      }
    }
  });
}

export function revealCell(r, c) {
  const cell = state.getCell(r, c);
  if (!cell || cell.isRevealed || cell.isFlagged) {
    return;
  }

  cell.isRevealed = true;
  state.incrementRevealedCells();

  if (cell.isMine) {
    state.setGameState(GAME_STATE.DEFEAT);
    state.clearTimerInterval();
    return;
  }

  checkWinCondition();

  if (state.getGameState() === GAME_STATE.VICTORY) {
    return;
  }

  if (cell.neighborMines === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;

        revealCell(r + dr, c + dc);
      }
    }
  }
}

export function checkWinCondition() {
  const config = state.getGameConfig();
  if (!config) return;

  const nonMineCells = config.rows * config.cols - config.mineCount;

  if (state.getRevealedCells() === nonMineCells) {
    state.setGameState(GAME_STATE.VICTORY);
    state.clearTimerInterval();
  }
}

export function attemptChord(r, c) {
  const config = state.getGameConfig();
  if (!config) return;

  const cell = state.getCell(r, c);

  if (!cell.isRevealed || cell.neighborMines === 0) {
    return;
  }

  let adjacentFlags = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;

      const nr = r + dr;
      const nc = c + dc;

      const neighbor = state.getCell(nr, nc);
      if (neighbor && neighbor.isFlagged) {
        adjacentFlags++;
      }
    }
  }

  if (adjacentFlags !== cell.neighborMines) {
    return;
  }

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;

      const nr = r + dr;
      const nc = c + dc;

      const neighbor = state.getCell(nr, nc);

      if (neighbor && !neighbor.isRevealed && !neighbor.isFlagged) {
        revealCell(nr, nc);
      }
    }
  }
}

export function toggleCellMark(r, c) {
  const cell = state.getCell(r, c);
  if (!cell || cell.isRevealed) return;

  if (cell.isFlagged) {
    cell.isFlagged = false;
    state.decrementFlags();

    if (settings.useQuestionMarks) {
      cell.isQuestion = true;
    }
    return;
  }

  if (cell.isQuestion) {
    cell.isQuestion = false;
    return;
  }

  cell.isFlagged = true;
  state.incrementFlags();
}
