let header = document.querySelector('header');
let currLine = document.querySelectorAll('.line')[0];
let keyboard = document.querySelector('.keyboard');

let lineQty = 6;
let lineInx = 0;

let wordLength = 5;
let wordInx = 0;

let ref = '';
let fetchWordURL = 'https://words.dev-apis.com/word-of-the-day';
let validateWordURL = ' https://words.dev-apis.com/validate-word';

let isWin = false;

init();

async function init() {
  ref = await fetchWord();
  document.addEventListener('keydown', solveKeydown);
  keyboard.addEventListener('click', solveClick);
}

/* event handler */
function solveKeydown(event) {
  let currLetter = currLine.children[wordInx];
  let keyVal = event.key;
  if (isLetter(keyVal)) {
    solveLetter(currLetter, keyVal);
  } else if (keyVal === 'Backspace') {
    solveBackspace(currLetter);
  } else if (keyVal === 'Enter') {
    solveEnter(currLetter);
  }
}

function solveClick(event) {
  if (event.target.tagName === 'BUTTON') {
    let currLetter = currLine.children[wordInx];
    let keyVal = event.target.innerText;
    if (isLetter(keyVal)) {
      solveLetter(currLetter, keyVal);
    } else if (keyVal === '←') {
      solveBackspace(currLetter);
    } else if (keyVal === 'Enter') {
      solveEnter(currLetter);
    }
  }
}

// event handler assistant functions
function solveLetter(currLetter, keyVal) {
  if (currLetter.innerText === '') {
    currLetter.innerText = keyVal;
    currLetter.classList.add('disabled');
    if (wordInx < wordLength - 1) {
      wordInx++;
    }
  } else {
    if (wordInx < wordLength - 1) {
      wordInx++;
      currLetter = currLine.children[wordInx];
      currLetter.innerText = keyVal;
      currLetter.classList.add('disabled');
    }
  }
}

function solveBackspace(currLetter) {
  if (currLetter.innerText !== '') {
    currLetter.innerText = '';
    currLetter.classList.remove('disabled');
    if (wordInx > 0) {
      wordInx--;
    }
  } else {
    if (wordInx > 0) {
      wordInx--;
    }
    currLetter = currLine.children[wordInx];
    currLetter.innerText = '';
    currLetter.classList.remove('disabled');
  }
}

async function solveEnter(currLetter) {
  if (wordInx === wordLength - 1) {
    if (currLetter.innerText !== '') {
      await validateCurrLine(currLine);
    }
  }
}

/* validation */
async function validateCurrLine(currLine) {
  let currWord = getCurrWord(currLine);
  fireSpinner(currLine);
  let isValid = await validateCurrWord(currWord);
  stopSpinner(currLine);
  if (isValid) {
    renderCurrLine(currLine, currWord);
    if (currWord == ref) {
      isWin = true;
      solveWin();
    }
    if (!isWin) {
      moveToNextLine();
    }
  } else {
    fireShaker(currLine);
    setTimeout(() => {
      stopShaker(currLine);
    }, 1000);
  }
}

function moveToNextLine() {
  if (lineInx < lineQty - 1) {
    lineInx++;
    currLine = document.querySelectorAll('.line')[lineInx];
    wordInx = 0;
  } else {
    solveLose();
  }
}

/* word */
function isLetter(letter) {
  return /^[a-zA-Z]$/.test(letter);
}

async function fetchWord() {
  let response = await fetch(fetchWordURL);
  let responseJSON = await response.json();
  let word = responseJSON.word;
  return word;
}

function getCurrWord(currLine) {
  let currLetters = Array.from(currLine.children);
  let currWord = '';
  currLetters.forEach((currLetter) => (currWord += currLetter.innerText));
  return currWord.toLowerCase();
}

async function validateCurrWord(currWord) {
  let response = await fetch(validateWordURL, {
    method: 'POST',
    body: JSON.stringify({ word: currWord }),
  });
  let responseJSON = await response.json();
  let isValid = responseJSON.validWord;
  return isValid;
}

function countWord(word) {
  let wordCounter = {};
  let letters = word.split('');
  letters.forEach((letter, idx) => {
    if (!(letter in wordCounter)) {
      wordCounter[letter] = { quantity: 1 };
      wordCounter[letter].position = [idx];
      wordCounter[letter].matched = [];
      wordCounter[letter].mismatched = [];
    } else {
      wordCounter[letter].quantity++;
      wordCounter[letter].position.push(idx);
    }
  });
  return wordCounter;
}

/* rendering */
function renderCurrLine(currLine, word) {
  let currLetters = Array.from(currLine.children);
  let refCounter = countWord(ref);
  let wordCounter = countWord(word);

  Object.keys(wordCounter).forEach((currLetter) => {
    if (currLetter in refCounter) {
      solveExact(currLetter, currLetters, refCounter, wordCounter);
      solveExist(currLetter, currLetters, refCounter, wordCounter);
    } else {
      solveNonExist(currLetter, currLetters, wordCounter);
    }
  });
}

function solveExact(currLetter, currLetters, refCounter, wordCounter) {
  wordCounter[currLetter].position.forEach((currPos) => {
    if (refCounter[currLetter].position.includes(currPos)) {
      wordCounter[currLetter].matched.push(currPos);
      currLetters[currPos].classList.add('exact');
      let correspondBtn = document.getElementById(currLetter);
      correspondBtn.classList.add('exact');
    } else {
      wordCounter[currLetter].mismatched.push(currPos);
    }
  });
}

function solveExist(currLetter, currLetters, refCounter, wordCounter) {
  let refQty = refCounter[currLetter].position.length;
  let matchedQty = wordCounter[currLetter].matched.length;
  let mismatchedQty = wordCounter[currLetter].mismatched.length;
  if (refQty - matchedQty === 0) {
    wordCounter[currLetter].mismatched.forEach((currPos) => {
      currLetters[currPos].classList.add('non-exist');
    });
  }
  if (refQty - matchedQty >= mismatchedQty) {
    for (let i = 0; i < mismatchedQty; i++) {
      let currPos = wordCounter[currLetter].mismatched[i];
      currLetters[currPos].classList.add('exist');
    }
  }
  if (refQty - matchedQty < mismatchedQty) {
    for (let i = 0; i < mismatchedQty; i++) {
      let currPos = wordCounter[currLetter].mismatched[i];
      if (i < refQty - matchedQty) {
        currLetters[currPos].classList.add('exist');
      } else {
        currLetters[currPos].classList.add('non-exist');
      }
    }
  }
  let correspondBtn = document.getElementById(currLetter);
  if (!correspondBtn.classList.contains('exact')) {
    correspondBtn.classList.add('exist');
  }
}

function solveNonExist(currLetter, currLetters, wordCounter) {
  wordCounter[currLetter].position.forEach((currPos) => {
    currLetters[currPos].classList.add('non-exist');
    let correspondBtn = document.getElementById(currLetter);
    correspondBtn.classList.add('non-exist');
  });
}

/* animation */
// spinner
function fireSpinner(currLine) {
  let currLetters = Array.from(currLine.children);
  currLetters.forEach((currLetter) => {
    currLetter.classList.add('spin');
  });
}

function stopSpinner(currLine) {
  let currLetters = Array.from(currLine.children);
  currLetters.forEach((currLetter) => {
    currLetter.classList.remove('spin');
  });
}

function fireShaker(currLine) {
  currLine.classList.add('shake');
}

function stopShaker(currLine) {
  currLine.classList.remove('shake');
}

// result
function solveWin() {
  header.innerText = '🎊';
}

function solveLose() {
  header.innerHTML = `<span>'<span class='answer'>${ref.toUpperCase()}</span>'</span>`;
}
