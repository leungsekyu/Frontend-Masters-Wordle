let header = document.querySelector('header');
let loadingIndicator = document.querySelector('.loading-indicator');
let currLine = document.querySelectorAll('.line')[0];
let currLetters = Array.from(currLine.children);
let keyboard = document.querySelector('.keyboard');

const LINE_QUANTITY = 6;
let lineIdx = 0;

const WORD_LENGTH = 5;
let currWord = '';

let ref = '';
let fetchWordURL = 'https://words.dev-apis.com/word-of-the-day';
let validateWordURL = ' https://words.dev-apis.com/validate-word';

let isWin = false;

init();

async function init() {
  ref = await fetchWord();
  if (ref !== undefined) {
    document.addEventListener('keydown', solveKeydown);
    keyboard.addEventListener('click', solveClick);
  }
}

/* event handler */
function solveKeydown(event) {
  let keyVal = event.key;
  solveKey(keyVal);
}

function solveClick(event) {
  if (event.target.tagName === 'BUTTON') {
    let keyVal = event.target.innerText;
    solveKey(keyVal);
  }
}

function removeEventListeners() {
  document.removeEventListener('keydown', solveKeydown);
  keyboard.removeEventListener('click', solveClick);
}

// event handler assistant functions
function solveKey(keyVal) {
  if (isLetter(keyVal)) {
    // transform 'keyVal' to lower case is **very** important to validation afterwards
    solveLetter(keyVal.toLowerCase());
  } else if (keyVal === 'Backspace' || keyVal === '←') {
    solveBackspace();
  } else if (keyVal === 'Enter') {
    solveEnter();
  }
}

function solveLetter(keyVal) {
  if (currWord.length < WORD_LENGTH) {
    let currLetter = currLetters[currWord.length];
    currLetter.innerText = keyVal;
    currLetter.classList.add('disabled');
    currWord += keyVal;
  }
}

function solveBackspace() {
  if (currWord.length > 0) {
    let currLetter = currLetters[currWord.length - 1];
    currLetter.innerText = '';
    currLetter.classList.remove('disabled');
    currWord = currWord.substring(0, currWord.length - 1);
  }
}

async function solveEnter() {
  if (currWord.length === WORD_LENGTH) {
    await validateCurrLine();
  }
}

/* validation */
async function validateCurrLine() {
  beforeValidatingCurrWord();
  let isValid = await validateCurrWord();
  afterValidatingCurrWord();
  if (isValid) {
    renderCurrLine();
    if (currWord === ref) {
      isWin = true;
      solveWin();
      removeEventListeners();
    }
    if (!isWin) {
      moveToNextLine();
    }
  } else {
    fireShaker();
    setTimeout(() => {
      stopShaker();
    }, 1000);
  }
}

function moveToNextLine() {
  if (lineIdx < LINE_QUANTITY - 1) {
    lineIdx++;
    currLine = document.querySelectorAll('.line')[lineIdx];
    currLetters = Array.from(currLine.children);
    currWord = '';
  } else {
    solveLose();
    removeEventListeners();
  }
}

/* word */
function isLetter(letter) {
  return /^[a-zA-Z]$/.test(letter);
}

async function fetchWord() {
  try {
    beforeFetchingWord();
    let response = await fetch(fetchWordURL);
    let responseJSON = await response.json();
    afterFetchingWord();
    let word = responseJSON.word;
    console.log(word);
    return word;
  } catch (error) {
    solveFetchWordError();
  }
}

function solveFetchWordError() {
  document.getElementById('1a').innerText = 'n';
  document.getElementById('1b').innerText = 'e';
  document.getElementById('1c').innerText = 't';
  document.getElementById('1d').innerText = 'w';
  document.getElementById('1e').innerText = 'o';
  document.getElementById('2a').innerText = 'r';
  document.getElementById('2b').innerText = 'k';
  document.getElementById('3a').innerText = 'e';
  document.getElementById('3b').innerText = 'r';
  document.getElementById('3c').innerText = 'r';
  document.getElementById('3d').innerText = 'o';
  document.getElementById('3e').innerText = 'r';
  document.getElementById('4a').innerText = '🥲';
  document.getElementById('6e').innerText = '⟳';
  document.getElementById('6e').classList.add('refresh');
  document.getElementById('6e').addEventListener('click', function () {
    location.reload();
  });
}

async function validateCurrWord() {
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
function renderCurrLine() {
  let refCounter = countWord(ref);
  let currWordCounter = countWord(currWord);

  Object.keys(currWordCounter).forEach((currLetter) => {
    if (currLetter in refCounter) {
      solveExact(currLetter, refCounter, currWordCounter);
      solveExist(currLetter, refCounter, currWordCounter);
    } else {
      solveNonExist(currLetter, currWordCounter);
    }
  });
}

function solveExact(currLetter, refCounter, currWordCounter) {
  currWordCounter[currLetter].position.forEach((currPos) => {
    if (refCounter[currLetter].position.includes(currPos)) {
      currWordCounter[currLetter].matched.push(currPos);
      currLetters[currPos].classList.add('exact');
      let correspBtn = document.getElementById(currLetter);
      correspBtn.classList.add('exact');
    } else {
      currWordCounter[currLetter].mismatched.push(currPos);
    }
  });
}

function solveExist(currLetter, refCounter, currWordCounter) {
  let refQty = refCounter[currLetter].position.length;
  let matchedQty = currWordCounter[currLetter].matched.length;
  let mismatchedQty = currWordCounter[currLetter].mismatched.length;
  if (refQty - matchedQty === 0) {
    currWordCounter[currLetter].mismatched.forEach((currPos) => {
      currLetters[currPos].classList.add('non-exist');
    });
  }
  if (refQty - matchedQty >= mismatchedQty) {
    for (let i = 0; i < mismatchedQty; i++) {
      let currPos = currWordCounter[currLetter].mismatched[i];
      currLetters[currPos].classList.add('exist');
    }
  }
  if (refQty - matchedQty < mismatchedQty) {
    for (let i = 0; i < mismatchedQty; i++) {
      let currPos = currWordCounter[currLetter].mismatched[i];
      if (i < refQty - matchedQty) {
        currLetters[currPos].classList.add('exist');
      } else {
        currLetters[currPos].classList.add('non-exist');
      }
    }
  }
  let correspBtn = document.getElementById(currLetter);
  if (!correspBtn.classList.contains('exact')) {
    correspBtn.classList.add('exist');
  }
}

function solveNonExist(currLetter, wordCounter) {
  wordCounter[currLetter].position.forEach((currPos) => {
    currLetters[currPos].classList.add('non-exist');
    let correspBtn = document.getElementById(currLetter);
    console.log(correspBtn);
    correspBtn.classList.add('non-exist');
  });
}

/* animation */
// spinner
function beforeValidatingCurrWord() {
  currLetters.forEach((currLetter) => {
    addSpinner(currLetter);
  });
}

function afterValidatingCurrWord() {
  currLetters.forEach((currLetter) => {
    removeSpinner(currLetter);
  });
}

function beforeFetchingWord() {
  loadingIndicator.classList.add('bounce');
}

function afterFetchingWord() {
  loadingIndicator.classList.remove('bounce');
}

function addSpinner(elem) {
  elem.classList.add('spin');
}

function removeSpinner(elem) {
  elem.classList.remove('spin');
}

function fireShaker() {
  currLine.classList.add('shake');
}

function stopShaker() {
  currLine.classList.remove('shake');
}

// result
function solveWin() {
  header.innerText = '🎊';
}

function solveLose() {
  header.classList.add('win');
  header.innerHTML = `'<span class='answer'>${ref.toUpperCase()}</span>'`;
}
