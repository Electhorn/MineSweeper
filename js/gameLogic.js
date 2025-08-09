import state from "./state.js";
import { GAME_STATE, settings } from "./config.js";

// Fisher-Yates shuffle implementation with modern syntax
function _shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Board initialization with modern array methods
export function initBoard() {
  const config = state.getGameConfig();
  if (!config) return;

  const newBoard = Array.from({ length: config.rows }, () =>
    Array.from({ length: config.cols }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      isQuestion: false,
      neighborMines: 0,
    }))
  );
  state.setBoard(newBoard);
}

// Mine placement with performance improvements
export function popMines(safeR, safeC) {
  const config = state.getGameConfig();
  if (!config) return [];

  const { rows, cols, mineCount } = config;
  const totalCells = rows * cols;
  const useSafeZone = mineCount <= totalCells - 9;

  if (!useSafeZone) {
    console.warn("Too many mines. Can't guarantee safe start area.");
  }

  // Pre-calculate safe zone boundaries
  const minR = useSafeZone ? Math.max(0, safeR - 1) : 0;
  const maxR = useSafeZone ? Math.min(rows - 1, safeR + 1) : rows - 1;
  const minC = useSafeZone ? Math.max(0, safeC - 1) : 0;
  const maxC = useSafeZone ? Math.min(cols - 1, safeC + 1) : cols - 1;

  const potentialMineCoords = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Skip safe zone if applicable
      if (useSafeZone && r >= minR && r <= maxR && c >= minC && c <= maxC) {
        continue;
      }
      potentialMineCoords.push({ r, c });
    }
  }

  _shuffleArray(potentialMineCoords);
  const mineLocations = potentialMineCoords.slice(0, mineCount);

  // Batch update state for better performance
  mineLocations.forEach(({ r, c }) => {
    state.getCell(r, c).isMine = true;
  });

  return mineLocations;
}

// Neighbor calculation with bounds checking optimization
export function calcNeighbor(mineLocations) {
  if (!state.getGameConfig()) return;

  const { rows, cols } = state.getGameConfig();

  mineLocations.forEach(({ r: mineR, c: mineC }) => {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;

        const nr = mineR + dr;
        const nc = mineC + dc;

        // Early bounds checking
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          const neighborCell = state.getCell(nr, nc);
          if (!neighborCell.isMine) {
            neighborCell.neighborMines++;
          }
        }
      }
    }
  });
}

// Reveal cell with win condition optimization
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

  // Only check win condition when revealing non-mine cells
  if (state.getGameState() !== GAME_STATE.VICTORY) {
    checkWinCondition();

    // Recursive reveal for empty cells
    if (cell.neighborMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          revealCell(r + dr, c + dc);
        }
      }
    }
  }
}

// Optimized win condition checking
export function checkWinCondition() {
  const config = state.getGameConfig();
  if (!config) return;

  const { rows, cols, mineCount } = config;
  const revealedCells = state.getRevealedCells();
  const nonMineCells = rows * cols - mineCount;

  if (revealedCells === nonMineCells) {
    state.setGameState(GAME_STATE.VICTORY);
    state.clearTimerInterval();
  }
}

// Chording with performance improvements
export function attemptChord(r, c) {
  const config = state.getGameConfig();
  if (!config) return;

  const cell = state.getCell(r, c);
  if (!cell.isRevealed || cell.neighborMines === 0) {
    return;
  }

  // Count adjacent flags efficiently
  let adjacentFlags = 0;
  const neighbors = [];

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;

      const nr = r + dr;
      const nc = c + dc;
      const neighbor = state.getCell(nr, nc);

      if (neighbor) {
        if (neighbor.isFlagged) {
          adjacentFlags++;
        }
        neighbors.push({ cell: neighbor, r: nr, c: nc });
      }
    }
  }

  // Only proceed if flag count matches neighbor mine count
  if (adjacentFlags === cell.neighborMines) {
    neighbors.forEach(({ cell: neighbor, r: nr, c: nc }) => {
      if (!neighbor.isRevealed && !neighbor.isFlagged) {
        revealCell(nr, nc);
      }
    });
  }
}

// Cell marking with cleaner logic
export function toggleCellMark(r, c) {
  const cell = state.getCell(r, c);
  if (!cell || cell.isRevealed) return;

  // Use state machine approach for marking
  if (cell.isFlagged) {
    cell.isFlagged = false;
    state.decrementFlags();
    cell.isQuestion = settings.useQuestionMarks;
  } else if (cell.isQuestion) {
    cell.isQuestion = false;
  } else {
    cell.isFlagged = true;
    state.incrementFlags();
  }
}
