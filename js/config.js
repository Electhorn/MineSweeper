export const GAME_STATE = {
  IDLE: "idle",
  RUNNING: "running",
  VICTORY: "victory",
  DEFEAT: "defeat",
};

export const difficulty = {
  beginner: { rows: 9, cols: 9, mineCount: 10 },
  intermediate: { rows: 16, cols: 16, mineCount: 40 },
  expert: { rows: 16, cols: 30, mineCount: 99 },
};

export const settings = {
  useQuestionMarks: true,
};
