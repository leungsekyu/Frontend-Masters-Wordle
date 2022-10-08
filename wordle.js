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

let isLoading = true;
let isError = false;
let isFinished = false;

init();

async function init() {
  ref = await fetchWord();
  document.addEventListener('keydown', solveKeydown);
  keyboard.addEventListener('click', solveClick);
}

/* event handler */
function solveKeydown(event) {
  if (isLoading || isFinished) {
    return;
  }
  let keyVal = event.key;
  solveKey(keyVal);
}

function solveClick(event) {
  if (isLoading || isFinished) {
    return;
  }
  if (event.target.tagName === 'BUTTON') {
    let keyVal = event.target.innerText;
    solveKey(keyVal);
  }
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
  isLoading = true;
  beforeValidatingCurrWord();
  let isValid = await validateCurrWord();
  afterValidatingCurrWord();
  isLoading = false;
  if (isValid) {
    renderCurrLine();
    if (currWord === ref) {
      solveWin();
    } else {
      moveToNextLine();
    }
  } else {
    if (!isError) {
      // repaint
      setShaker(false);
      setTimeout(() => {
        setShaker(true);
      }, 40);
    }
  }
}

function moveToNextLine() {
  lineIdx++;
  if (lineIdx < LINE_QUANTITY) {
    currLine = document.querySelectorAll('.line')[lineIdx];
    currLetters = Array.from(currLine.children);
    currWord = '';
  } else {
    solveLose();
  }
}

/* word */
function isLetter(letter) {
  return /^[a-zA-Z]$/.test(letter);
}

async function fetchWord() {
  try {
    setBouncer(true);
    let response = await fetch(fetchWordURL);
    let { word } = await response.json(); // destructing
    setBouncer(false);
    isLoading = false;
    return word;
  } catch (error) {
    solveNetworkError();
  }
}

function solveNetworkError() {
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
  document.querySelectorAll('.letter').forEach((letter) => {
    letter.classList.remove('disabled');
    letter.classList.remove('correct');
    letter.classList.remove('close');
    letter.classList.remove('wrong');
  });
}

async function validateCurrWord() {
  try {
    let response = await fetch(validateWordURL, {
      method: 'POST',
      body: JSON.stringify({ word: currWord }),
    });
    let { validWord } = await response.json();
    return validWord;
  } catch (error) {
    solveNetworkError();
    isError = true;
  }
}

function countLetters(word) {
  let letterCounter = {};
  let letters = word.split('');
  letters.forEach((letter) => {
    if (!letterCounter[letter]) {
      letterCounter[letter] = 1;
    } else {
      letterCounter[letter]++;
    }
  });
  return letterCounter;
}

/* rendering */
function renderCurrLine() {
  let refCounter = countLetters(ref);

  for (let i = 0; i < WORD_LENGTH; i++) {
    let currLetter = currWord[i];
    let refLetter = ref[i];
    if (currLetter === refLetter) {
      refCounter[currLetter]--; // very vital
      currLetters[i].classList.add('correct');
      let correspBtn = document.getElementById(currLetter);
      correspBtn.classList.add('correct');
    }
  }

  for (let i = 0; i < WORD_LENGTH; i++) {
    let currLetter = currWord[i];
    let refLetter = ref[i];
    if (currLetter === refLetter) {
      // do nothing
    } else {
      if (refCounter[currLetter] && refCounter[currLetter] > 0) {
        refCounter[currLetter]--; // very vital
        currLetters[i].classList.add('close');
        let correspBtn = document.getElementById(currLetter);
        correspBtn.classList.add('close');
      } else {
        currLetters[i].classList.add('wrong');
        let correspBtn = document.getElementById(currLetter);
        correspBtn.classList.add('wrong');
      }
    }
  }
}

/* animation */
function beforeValidatingCurrWord() {
  currLetters.forEach((currLetter) => {
    setSpinner(currLetter, true);
  });
}

function afterValidatingCurrWord() {
  currLetters.forEach((currLetter) => {
    setSpinner(currLetter, false);
  });
}

function setBouncer(isBouncing) {
  loadingIndicator.classList.toggle('bounce', isBouncing);
}

function setSpinner(elem, isSpinning) {
  elem.classList.toggle('spin', isSpinning);
}

function setShaker(isShaking) {
  currLine.classList.toggle('shake', isShaking);
}

// result
function solveWin() {
  isFinished = true;
  header.innerText = '🎊';
}

function solveLose() {
  isFinished = true;
  header.classList.add('win');
  header.innerHTML = `'<span class='answer'>${ref.toUpperCase()}</span>'`;
}
