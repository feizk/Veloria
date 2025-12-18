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

module.exports = {
  sleep,
  shuffle,
  normalize,
  matchScore,
};
