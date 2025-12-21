const levenshtein = require("fast-levenshtein");

function calculateScore(userAnswer, correctAnswer, maxPoints = 50) {
  if (!userAnswer || !correctAnswer) return 0;

  const user = userAnswer.trim().toLowerCase();
  const correct = correctAnswer.trim().toLowerCase();

  if (user === correct) return maxPoints;

  const distance = levenshtein.get(user, correct);
  const maxLen = Math.max(user.length, correct.length);

  const similarity = 1 - distance / maxLen; // 0 to 1

  // Give points proportional to similarity
  // even if similarity is low, give a minimum (optional)
  const score = Math.round(maxPoints * similarity);

  return score; // 0 if totally wrong, >0 if close
}

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function matchScore(a, b) {
  const aWords = new Set(a.split(" "));
  const bWords = new Set(b.split(" "));

  let matches = 0;
  for (const word of aWords) {
    if (bWords.has(word)) matches++;
  }

  return matches / bWords.size;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
  sleep,
  shuffle,
  normalize,
  matchScore,
  calculateScore,
  getRandomInt,
};
