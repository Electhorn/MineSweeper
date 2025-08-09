const HIGH_SCORE_KEY = "winmine_classic_highscores";
const DEFAULT_SCORES = Object.freeze({
  beginner: 999,
  intermediate: 999,
  expert: 999,
});

export function getHighScores() {
  let loadedScores = {};
  try {
    const rawData = localStorage.getItem(HIGH_SCORE_KEY);
    if (rawData) {
      const parsed = JSON.parse(rawData);
      if (typeof parsed === "object" && parsed !== null) {
        loadedScores = parsed;
      }
    }
  } catch (error) {
    console.warn(
      "No se pudieron leer las puntuaciones guardadas. Pueden estar corruptas. Se usarán los valores por defecto.",
      error
    );
  }
  return { ...DEFAULT_SCORES, ...loadedScores };
}

function setHighScores(scores) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(scores));
  } catch (error) {
    console.error("No se pudieron guardar las puntuaciones.", error);
  }
}

export function checkAndSetHighScore(difficulty, time) {
  if (!(difficulty in DEFAULT_SCORES)) {
    return false;
  }
  const scores = getHighScores();
  if (time < scores[difficulty]) {
    scores[difficulty] = time;
    setHighScores(scores);
    return true;
  }
  return false;
}

export function resetHighScores() {
  setHighScores({ ...DEFAULT_SCORES });
}
