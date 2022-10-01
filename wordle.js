// header
let header = document.querySelector('header');
// row
let currRow = document.querySelectorAll('.row')[0];
let rowQty = 6;
let idx = 0;
// state
let isWin = false;
// API
let fetchWordURL = 'https://words.dev-apis.com/word-of-the-day?random=1';
let validateWordURL = ' https://words.dev-apis.com/validate-word';
// reference word
let ref = '';

init();

// work flow
async function init() {
  await fetchWord();
  initAllRows();
  currRowAddEventListeners();
}

function moveToNextRow() {
  idx++;
  if (idx < rowQty) {
    currRow = document.querySelectorAll('.row')[idx];
    initCurrRow();
    currRowAddEventListeners();
  } else {
    solveLose();
  }
}

// initialization
function initAllRows() {
  let allInputs = document.querySelectorAll('input');
  allInputs.forEach((currInput) => {
    currInput.disabled = true;
  });
  focusBeginning();
}

function initCurrRow() {
  let inputs = Array.from(currRow.children);
  inputs.forEach((currInput) => {
    currInput.value = '';
    currInput.classList.remove('disabled');
  });
  focusBeginning();
}

function focusBeginning() {
  currRow.children[0].disabled = false;
  currRow.children[0].focus();
}

// evnet listeners
function currRowAddEventListeners() {
  currRow.addEventListener('keydown', solveAlpha);
  currRow.addEventListener('input', solveInput);
  // backspace solution:
  // 1. 'keydown' event fires, cursor goes back to previous input
  // 2. 'input' event fires, delete 1 letter in previous input
  currRow.addEventListener('keydown', solveBackspace);
  currRow.addEventListener('keydown', solveEnter);
}

function currRowRemoveEventListeners() {
  currRow.removeEventListener('keydown', solveAlpha);
  currRow.removeEventListener('input', solveInput);
  currRow.removeEventListener('keydown', solveBackspace);
  currRow.removeEventListener('keydown', solveEnter);
}

// event handles
function solveAlpha(event) {
  if (!isLetter(event.key)) {
    if (event.key !== 'Backspace' && event.key !== 'Enter') {
      event.preventDefault();
    }
  }
}

function solveInput(event) {
  let currInput = event.target;
  let currMaxLength = parseInt(currInput.maxLength, 10);
  let currLength = currInput.value.length;

  if (currLength === currMaxLength) {
    let nextInput = currInput.nextElementSibling;
    if (nextInput !== null) {
      nextInput.disabled = false;
      currInput.disabled = true;
      nextInput.focus();
    }
    currInput.classList.add('disabled');
  }
}

function solveBackspace(event) {
  let currInput = event.target;
  if (event.key === 'Backspace') {
    if (currInput.value.length === 0) {
      let prevInput = currInput.previousElementSibling;
      if (prevInput !== null) {
        prevInput.disabled = false;
        prevInput.classList.remove('disabled');
        prevInput.focus();
      }
    } else {
      currInput.classList.remove('disabled');
    }
  }
}

async function solveEnter(event) {
  let currInput = event.target;
  if (event.key === 'Enter') {
    let nextInput = currInput.nextElementSibling;
    if (currInput.value !== '' && nextInput === null) {
      await validateCurrRow(currInput);
    }
  }
}

/* validation flow */
async function validateCurrRow(currInput) {
  let currWord = mergeWord(currRow);
  fireSpinner(currRow);
  let isValidWord = await validateWord(currWord);
  stopSpinner(currRow);

  if (isValidWord) {
    currInput.disabled = true;
    renderCurrRow(currRow, currWord);
    if (currWord === ref) {
      solveWin();
    }
    currRowRemoveEventListeners();
    if (!isWin) {
      moveToNextRow();
    }
  }
}

function renderCurrRow(row, word) {
  let inputs = Array.from(row.children);
  let refCounter = countWord(ref);
  let counter = countWord(word);

  Object.keys(counter).forEach((char) => {
    if (char in refCounter) {
      solveExact(char, inputs, refCounter, counter);
      solveExist(char, inputs, refCounter, counter);
    } else {
      solveNonExist(char, inputs, counter);
    }
  });
}

/* word */
async function fetchWord() {
  let response = await fetch(fetchWordURL);
  let responseJSON = await response.json();
  ref = responseJSON.word;
}

function mergeWord(row) {
  let inputs = Array.from(row.children);
  let word = '';
  inputs.forEach((input) => {
    word += input.value;
  });
  return word.toLowerCase();
}

function countWord(word) {
  let counter = {};
  let chars = word.split('');
  chars.forEach((char, idx) => {
    if (!(char in counter)) {
      counter[char] = { quantity: 1 };
      counter[char].position = [idx];
      counter[char].matched = [];
      counter[char].mismatched = [];
    } else {
      counter[char].quantity++;
      counter[char].position.push(idx);
    }
  });
  return counter;
}

/* validation assistant */
function isLetter(letter) {
  return /^[a-zA-Z]$/.test(letter);
}

async function validateWord(word) {
  let response = await fetch(validateWordURL, {
    method: 'POST',
    body: JSON.stringify({ word: word }),
  });
  let responseJSON = await response.json();
  return responseJSON.validWord;
}

function solveExact(char, inputs, refCounter, counter) {
  counter[char].position.forEach((currPos) => {
    if (refCounter[char].position.includes(currPos)) {
      counter[char].matched.push(currPos);
      inputs[currPos].classList.add('exact');
      let guessedCharIndicator = document.getElementById(char);
      guessedCharIndicator.classList.add('exact');
    } else {
      counter[char].mismatched.push(currPos);
    }
  });
}

function solveExist(char, inputs, refCounter, counter) {
  let refNum = refCounter[char].position.length;
  let matchedNum = counter[char].matched.length;
  let mismatchedNum = counter[char].mismatched.length;
  if (refNum - matchedNum === 0) {
    counter[char].mismatched.forEach((currPos) => {
      inputs[currPos].classList.add('non-exist');
    });
  }
  if (refNum - matchedNum >= mismatchedNum) {
    for (let i = 0; i < mismatchedNum; i++) {
      let currPos = counter[char].mismatched[i];
      inputs[currPos].classList.add('exist');
    }
  }
  if (refNum - matchedNum < mismatchedNum) {
    for (let i = 0; i < mismatchedNum; i++) {
      let currPos = counter[char].mismatched[i];
      if (i < refNum - matchedNum) {
        inputs[currPos].classList.add('exist');
      } else {
        inputs[currPos].classList.add('non-exist');
      }
    }
  }
  let guessedCharIndicator = document.getElementById(char);
  if (!guessedCharIndicator.classList.contains('exact')) {
    guessedCharIndicator.classList.add('exist');
  }
}

function solveNonExist(char, inputs, counter) {
  counter[char].position.forEach((currPos) => {
    inputs[currPos].classList.add('non-exist');
    let guessedCharIndicator = document.getElementById(char);
    guessedCharIndicator.classList.add('non-exist');
  });
}

/* animation */
// spinner
function fireSpinner(row) {
  let inputs = Array.from(row.children);
  inputs.forEach((input) => {
    input.classList.add('spin');
  });
}

function stopSpinner(row) {
  let inputs = Array.from(row.children);
  inputs.forEach((input) => {
    input.classList.remove('spin');
  });
}

// result
function solveWin() {
  isWin = true;
  header.innerText = '🎊';
}

function solveLose() {
  header.innerHTML = `<span>'<span class='answer'>${ref.toUpperCase()}</span>'</span>`;
}
