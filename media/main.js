// @ts-nocheck
// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly

(function () {
  //====================================================
  // Global
  //====================================================
  const vscode = acquireVsCodeApi();

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data;

    // Message sent when the extension starts
    if (message.type === "allConfig") {
      // Put words list and settings into a state
      vscode.setState({
        allWords: message.words,
        language: message.language,
        count: message.count,
        mode: message.mode,
        punctuation: message.punctuation,
      });
      previousState = vscode.getState();

      // Change words list and settings
      allWords = message.words;
      setLanguage(message.language);
      setWordCount(message.count);
      setTimeCount(message.count);
      setTypingMode(message.mode);
      setPunctuation(message.punctuation);
    } else {
      // Message to change a single setting
      switch (message.config) {
        case "switchLanguage":
          setLanguage(message.value);
          setText();
          vscode.setState({ ...previousState, language: message.value });
          previousState = vscode.getState();
          break;
        case "switchTypingMode":
          setTypingMode(message.value);
          vscode.setState({ ...previousState, mode: message.value });
          previousState = vscode.getState();
          break;
        case "togglePunctuation":
          setPunctuation(message.value);
          vscode.setState({ ...previousState, punctuation: message.value });
          previousState = vscode.getState();
          break;
        case "changeCount":
          setWordCount(message.value);
          setTimeCount(message.value);
          vscode.setState({ ...previousState, count: message.value });
          previousState = vscode.getState();
          break;
        default:
          break;
      }
    }
  });

  // Initialize typing mode variable
  let typingMode = "words (fixed amount)";

  // Get document elements
  const textDisplay = document.querySelector("#text-display");
  const inputField = document.querySelector("#input-field");

  // Initialize dynamic variables
  let wordCount;
  let timeCount;
  let allWords = [];
  let randomWords = [];
  let wordList = [];
  let currentWord = 0;
  let correctKeys = 0;
  let startDate = 0;
  let timer;
  let timerActive = false;
  let punctuation = false;

  // Get all words and settings from the state if it exists
  let previousState = vscode.getState();
  if (previousState) {
    allWords = previousState.allWords;
    setLanguage(previousState.language);
    setWordCount(previousState.count);
    setTimeCount(previousState.count);
    setTypingMode(previousState.mode);
    setPunctuation(previousState.punctuation);
  }

  //====================================================
  // Words mode
  //====================================================
  // Restart if restart button hit
  document.querySelector("#restart-button").addEventListener("click", (e) => {
    setText(e);
  });

  // Restart if escape key hit
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      setText(e);
    }
  });

  // Function to generate a new list of words
  function setText(e) {
    e = e || window.event;
    var keepWordList = e && e.shiftKey;

    // Reset
    if (!keepWordList) {
      wordList = [];
    }
    currentWord = 0;
    correctKeys = 0;
    inputField.value = "";
    timerActive = false;
    clearTimeout(timer);
    textDisplay.style.display = "block";
    inputField.className = "";

    switch (typingMode) {
      case "words (fixed amount)":
        textDisplay.style.height = "auto";

        textDisplay.innerHTML = "";
        if (!keepWordList) {
          wordList = [];

          while (wordList.length < wordCount) {
            const randomWord =
              randomWords[Math.floor(Math.random() * randomWords.length)];
            if (
              wordList[wordList.length - 1] !== randomWord ||
              wordList[wordList.length - 1] === undefined
            ) {
              wordList.push(randomWord);
            }
          }
        }
        break;

      case "words (against the clock)":
        textDisplay.style.height = "3.2rem";

        document.querySelector(`#tc-${timeCount}`).innerHTML = timeCount;

        textDisplay.innerHTML = "";
        if (!keepWordList) {
          wordList = [];

          for (i = 0; i < 500; i++) {
            let n = Math.floor(Math.random() * randomWords.length);

            wordList.push(randomWords[n]);
          }
        }
    }

    if (punctuation) addPunctuations();
    showText();

    inputField.focus();
  }

  // Function to display a list of words
  function showText() {
    wordList.forEach((word) => {
      let span = document.createElement("span");
      span.innerHTML = word + " ";

      textDisplay.appendChild(span);
    });

    textDisplay.firstChild.classList.add("highlight");
  }

  // Function to add punctuation to a list of words
  function addPunctuations() {
    if (wordList[0] !== undefined) {
      // Capitalize first word
      wordList[0] = wordList[0][0].toUpperCase() + wordList[0].slice(1);

      // Add comma, fullstop, question mark, exclamation mark, semicolon. Capitalize the next word
      for (i = 0; i < wordList.length; i++) {
        const ran = Math.random();

        if (i < wordList.length - 1) {
          if (ran < 0.03) {
            wordList[i] += ",";
          } else if (ran < 0.05) {
            wordList[i] += ".";

            wordList[i + 1] =
              wordList[i + 1][0].toUpperCase() + wordList[i + 1].slice(1);
          } else if (ran < 0.06) {
            wordList[i] += "?";

            wordList[i + 1] =
              wordList[i + 1][0].toUpperCase() + wordList[i + 1].slice(1);
          } else if (ran < 0.07) {
            wordList[i] += "!";

            wordList[i + 1] =
              wordList[i + 1][0].toUpperCase() + wordList[i + 1].slice(1);
          } else if (ran < 0.08) {
            wordList[i] += ";";
          }
        }
      }

      wordList[wordList.length - 1] += ".";
    }
  }

  // Function to calculate and display result
  function showResult() {
    let words, minute, acc;
    switch (typingMode) {
      case "words (fixed amount)":
        words = correctKeys / 5;
        minute = (Date.now() - startDate) / 1000 / 60;
        let totalKeys = -1;

        wordList.forEach((e) => (totalKeys += e.length + 1));
        acc = Math.floor((correctKeys / totalKeys) * 100);
        break;

      case "words (against the clock)":
        words = correctKeys / 5;

        minute = timeCount / 60;
        let sumKeys = -1;

        for (i = 0; i < currentWord; i++) {
          sumKeys += wordList[i].length + 1;
        }
        acc = acc = Math.min(Math.floor((correctKeys / sumKeys) * 100), 100);
    }

    let wpm = Math.floor(words / minute);

    document.querySelector(
      "#right-wing"
    ).innerHTML = `WPM: ${wpm} / ACC: ${acc}`;
  }

  // Key is pressed in input field
  inputField.addEventListener("keydown", (e) => {
    // Add wrong class to input field
    switch (typingMode) {
      case "words (fixed amount)":
        if (currentWord < wordList.length) inputFieldClass();
      case "words (against the clock)":
        if (timerActive) inputFieldClass();
    }
    function inputFieldClass() {
      if (
        (e.key >= "a" && e.key <= "z") ||
        e.key === `'` ||
        e.key === "," ||
        e.key === "." ||
        e.key === ";"
      ) {
        let inputWordSlice = inputField.value + e.key;

        let currentWordSlice = wordList[currentWord].slice(
          0,
          inputWordSlice.length
        );

        inputField.className =
          inputWordSlice === currentWordSlice ? "" : "wrong";
      } else if (e.key === "Backspace") {
        let inputWordSlice = e.ctrlKey
          ? ""
          : inputField.value.slice(0, inputField.value.length - 1);

        let currentWordSlice = wordList[currentWord].slice(
          0,
          inputWordSlice.length
        );

        inputField.className =
          inputWordSlice === currentWordSlice ? "" : "wrong";
      } else if (e.key === " ") {
        inputField.className = "";
      }
    }

    // If it is the first character entered
    if (currentWord === 0 && inputField.value === "") {
      switch (typingMode) {
        case "words (fixed amount)":
          startDate = Date.now();
          break;

        case "words (against the clock)":
          if (!timerActive) {
            startTimer(timeCount);
            timerActive = true;
          }

          function startTimer(time) {
            if (time > 0) {
              document.querySelector(`#tc-${timeCount}`).innerHTML = time;
              timer = setTimeout(() => {
                time--;
                startTimer(time);
              }, 1000);
            } else {
              timerActive = false;

              textDisplay.style.display = "none";

              inputField.className = "";

              document.querySelector(`#tc-${timeCount}`).innerHTML = timeCount;
              showResult();
            }
          }
      }
    }

    // If it is the space key check the word and add correct/wrong class
    if (e.key === " ") {
      e.preventDefault();

      if (inputField.value !== "") {
        // Scroll down text when reach new line
        if (typingMode === "words (against the clock)") {
          const currentWordPosition =
            textDisplay.childNodes[currentWord].getBoundingClientRect();
          const nextWordPosition =
            textDisplay.childNodes[currentWord + 1].getBoundingClientRect();
          if (currentWordPosition.top < nextWordPosition.top) {
            for (i = 0; i < currentWord + 1; i++)
              textDisplay.childNodes[i].style.display = "none";
          }
        }

        // If it is not the last word increment currentWord,
        if (currentWord < wordList.length - 1) {
          if (inputField.value === wordList[currentWord]) {
            textDisplay.childNodes[currentWord].classList.add("correct");

            correctKeys += wordList[currentWord].length + 1;
          } else {
            textDisplay.childNodes[currentWord].classList.add("wrong");
          }

          textDisplay.childNodes[currentWord + 1].classList.add("highlight");
        } else if (currentWord === wordList.length - 1) {
          textDisplay.childNodes[currentWord].classList.add("wrong");
          showResult();
        }

        inputField.value = "";
        currentWord++;
      }

      // Else if it is the last word and input word is correct show the result
    } else if (currentWord === wordList.length - 1) {
      if (inputField.value + e.key === wordList[currentWord]) {
        textDisplay.childNodes[currentWord].classList.add("correct");

        correctKeys += wordList[currentWord].length;
        currentWord++;
        showResult();
      }
    }
  });

  // Command center actions
  document.querySelector("#wc-15")?.addEventListener("click", () => {
    setWordCount(15);
  });
  document.querySelector("#wc-30")?.addEventListener("click", () => {
    setWordCount(30);
  });
  document.querySelector("#wc-60")?.addEventListener("click", () => {
    setWordCount(60);
  });
  document.querySelector("#wc-120")?.addEventListener("click", () => {
    setWordCount(120);
  });
  document.querySelector("#wc-240")?.addEventListener("click", () => {
    setWordCount(240);
  });
  document.querySelector("#tc-15")?.addEventListener("click", () => {
    setTimeCount(15);
  });
  document.querySelector("#tc-30")?.addEventListener("click", () => {
    setTimeCount(30);
  });
  document.querySelector("#tc-60")?.addEventListener("click", () => {
    setTimeCount(60);
  });
  document.querySelector("#tc-120")?.addEventListener("click", () => {
    setTimeCount(120);
  });
  document.querySelector("#tc-240")?.addEventListener("click", () => {
    setTimeCount(240);
  });

  // Functions to change settings
  function setLanguage(_lang) {
    randomWords = allWords[_lang];
  }
  function setTypingMode(_mode) {
    const mode = _mode.toLowerCase();
    switch (mode) {
      case "words (fixed amount)":
        typingMode = mode;
        document.querySelector("#coding-area").style.display = "none";
        document.querySelector("#time-count").style.display = "none";
        document.querySelector("#language-selected").style.display = "none";
        document.querySelector("#typing-area").style.display = "inline";
        document.querySelector("#word-count").style.display = "inline";
        setText();
        break;

      case "words (against the clock)":
        typingMode = mode;
        document.querySelector("#coding-area").style.display = "none";
        document.querySelector("#word-count").style.display = "none";
        document.querySelector("#language-selected").style.display = "none";
        document.querySelector("#typing-area").style.display = "inline";
        document.querySelector("#time-count").style.display = "inline";
        setText();
        break;

      case "code snippets":
        typingMode = mode;
        document.querySelector("#typing-area").style.display = "none";
        document.querySelector("#word-count").style.display = "none";
        document.querySelector("#time-count").style.display = "none";
        document.querySelector("#coding-area").style.display = "inline";
        document.querySelector("#language-selected").style.display = "inline";

      default:
        console.error(`mode ${mode} is undefine`);
    }
  }
  function setPunctuation(_punc) {
    const punc = _punc.toLowerCase();
    if (punc === "true") {
      punctuation = true;
      setText();
    } else if (punc === "false") {
      punctuation = false;
      setText();
    }
  }
  function setWordCount(wc) {
    wordCount = wc;
    document
      .querySelectorAll("#word-count > span")
      .forEach((e) => (e.style.borderBottom = ""));
    document.querySelector(`#wc-${wordCount}`).style.borderBottom = "2px solid";
    setText();

    // Change state
    vscode.setState({ ...previousState, count: wordCount });

    // Send message to extension to update setting
    vscode.postMessage({
      command: "changeCount",
      count: wordCount,
    });
  }
  function setTimeCount(tc) {
    timeCount = tc;
    document.querySelectorAll("#time-count > span").forEach((e) => {
      e.style.borderBottom = "";
      e.innerHTML = e.id.substring(3, 6);
    });
    document.querySelector(`#tc-${timeCount}`).style.borderBottom = "2px solid";
    setText();

    // Change state
    vscode.setState({ ...previousState, count: timeCount });

    // Send message to extension to update setting
    vscode.postMessage({
      command: "changeCount",
      count: timeCount,
    });
  }

  //====================================================
  // Code mode
  //====================================================
  // Create item in local storage to store code snippet
  localStorage.setItem("code", "");

  // Set default code snippet
  const defaultCodeSnippet = `c
    [...new Set([...Object.keys(a), ...Object.keys(b)])].reduce(
    (acc, key) => ({ ...acc, [key]: fn(key, a[key], b[key]) }),
    {}
  );`;

  // Load code snippet from state or set to default one
  const codeSnippet = localStorage.getItem("code") || defaultCodeSnippet;

  // Add code snippet to the dom element
  document.getElementById("code-pre").innerHTML = DOMPurify.sanitize(
    highlightCode(codeSnippet)
  );

  // Initialize code snippet state variables
  let codeState = {
    firstChar: null,
    lastChar: null,
    currentChar: null,
    currentCharNum: 0,
    cursorLeftOffset: 0,
    cursorTopOffset: 0,
    linesLastCursorPositions: [],
  };

  // Save cursor in variable
  const cursor = document.getElementById("cursor");

  // Retrieve cursor dimensions from css
  let cursorWidth =
    parseInt(
      getComputedStyle(cursor)
        .getPropertyValue("--vscode-editor-font-size")
        .replace("px", "")
    ) * 0.5578;
  let cursorHeight =
    parseInt(
      getComputedStyle(cursor)
        .getPropertyValue("--vscode-editor-font-size")
        .replace("px", "")
    ) * 1.25;

  // Update state with the correct characters
  updateStateChars();

  // Add event listeners for key presses
  document.addEventListener("keydown", (e) => handleKeyDown(e));
  document.addEventListener("keypress", (e) => handleKeyPress(e));

  // Function to update characters in the state
  function updateStateChars() {
    const toPassSymbols = document.getElementsByClassName("topass");
    codeState = {
      ...codeState,
      firstChar: toPassSymbols[0],
      currentChar: toPassSymbols[0],
      lastChar: toPassSymbols[toPassSymbols.length - 1],
    };
  }

  // Function that code snippet highlighted and ready for rendering
  function highlightCode(code) {
    const highlightedCode = Prism.highlight(code, Prism.languages.javascript);
    const regexpTag = /(<\/?span.*?>)/;
    const tagsAndTextArr = highlightedCode.split(regexpTag);
    const regexpSpecialChar = /&[a-z]*;/;
    let codeToRender = "";

    // Wrap code characters with <span class='topass'>
    for (let i = 0; i < tagsAndTextArr.length; i++) {
      // If text element, wrap each symbol with span
      if (tagsAndTextArr[i] !== "" && !regexpTag.test(tagsAndTextArr[i])) {
        let newHtml = "";
        if (regexpSpecialChar.test(tagsAndTextArr[i])) {
          // Special characters
          const specialCharsArr = tagsAndTextArr[i].match(/&[a-z]*;/g);
          // If we have one special character without other symbols
          if (
            specialCharsArr.length === 1 &&
            specialCharsArr[0] === tagsAndTextArr[i]
          ) {
            newHtml += `<span class="char topass">${tagsAndTextArr[i]}</span>`;
            // If we have a special character with other symbols
          } else {
            const otherCharsArr = tagsAndTextArr[i].split(regexpSpecialChar);
            for (let j = 0; j < otherCharsArr.length; j++) {
              if (otherCharsArr[j] === "" && j < specialCharsArr.length) {
                newHtml += `<span class="char topass">${specialCharsArr[0]}</span>`;
                continue;
              }
              for (let k = 0; k < otherCharsArr[j].length; k++) {
                newHtml += `<span class="char topass">${otherCharsArr[j][k]}</span>`;
              }
              if (j !== otherCharsArr.length - 1) {
                newHtml += `<span class="char topass">${specialCharsArr[0]}</span>`;
              }
            }
          }
        } else {
          // Simple words and symbols
          for (let j = 0; j < tagsAndTextArr[i].length; j++) {
            newHtml += `<span class="char topass">${tagsAndTextArr[i][j]}</span>`;
          }
        }
        tagsAndTextArr[i] = newHtml;
      }
      codeToRender += tagsAndTextArr[i];
    }

    return codeToRender;
  }

  // Function that returns the next character to the cursor
  function getNextChar() {
    return document.getElementsByClassName("char")[
      codeState.currentCharNum + 1
    ];
  }

  // Function that returns the previous character to the cursor
  function getPrevChar() {
    return document.getElementsByClassName("char")[
      codeState.currentCharNum - 1
    ];
  }

  // Function that handles "tab" and "backspace" key presses
  function handleKeyDown(e) {
    // Tab: move cursor further
    if (e.which === 9) {
      e.preventDefault();
      const currentChar = codeState.currentChar;
      const currentCharCode = currentChar.innerText.charCodeAt(0);

      // If the current symbol is a tab character
      if (currentCharCode === 9) {
        handleKeyPress(e);
      }

      // If the current symbol is a tab consisting of spaces
      if (currentCharCode === 32) {
        // Count all next spaces
        let counter = 0;
        let summToAdd = 0;
        let currentEl = currentChar;

        // Calculate the distance to move the cursor and change classes of passed characters
        while (currentEl.innerText.charCodeAt(0) === 32) {
          summToAdd += cursorWidth;
          currentEl.classList.remove("topass");
          currentEl.classList.add("passed");
          currentEl = currentEl.nextElementSibling;
          counter++;
        }

        // Change state depending on how much spaces we have passed
        if (counter === 1) {
          // Single space just for space
          flashCursor();
        } else {
          // Move cursor through spaces
          codeState = {
            ...codeState,
            currentCharNum: codeState.currentCharNum + (counter - 1),
          };
          codeState = {
            ...codeState,
            cursorLeftOffset: codeState.cursorLeftOffset + summToAdd,
            currentChar: getNextChar(),
            currentCharNum: codeState.currentCharNum + 1,
          };
          updateCursorPosition(
            codeState.cursorLeftOffset,
            codeState.cursorTopOffset
          );
        }
      }
    }

    // Backspace: move cursor back
    if (e.key === "Backspace") {
      // If first element is reached, ignore
      if (codeState.currentChar === codeState.firstChar) {
        flashCursor();
        return;
      }

      // Else find out where we are and change state
      const currentChar = getPrevChar();
      const currentCharCode = currentChar.innerText.charCodeAt(0);

      codeState = { ...codeState, currentChar: currentChar };
      currentChar.classList.remove("notpassed");
      currentChar.classList.add("topass");

      // If we are at the beginning of the line, go to the previous line
      if (currentCharCode === 10) {
        const linesLastCursorPositions = codeState.linesLastCursorPositions;

        codeState = {
          ...codeState,
          cursorLeftOffset: linesLastCursorPositions.pop(),
          cursorTopOffset: codeState.cursorTopOffset - cursorHeight,
          linesLastCursorPositions,
          currentCharNum: codeState.currentCharNum - 1,
        };
        updateCursorPosition(
          codeState.cursorLeftOffset,
          codeState.cursorTopOffset
        );

        return;
      }

      // If it's the same line, go one back
      codeState = {
        ...codeState,
        cursorLeftOffset: codeState.cursorLeftOffset - cursorWidth,
        currentCharNum: codeState.currentCharNum - 1,
      };
      updateCursorPosition(
        codeState.cursorLeftOffset,
        codeState.cursorTopOffset
      );
    }
  }

  // Function that handles  all the other key presses
  function handleKeyPress(e) {
    // Other keys: change state depending on the key pressed
    e.preventDefault();

    const currentChar = codeState.currentChar;
    const typedSymbolCode = e.which;
    const currentCharCode = currentChar.innerText.charCodeAt(0);

    // If the current symbol is a new line, do nothing if 'enter' not hit
    if (currentCharCode === 10 && typedSymbolCode !== 13) {
      flashCursor();
      return;
    }

    // If the current symbol is not new line, do nothing if 'enter' pressed
    if (currentCharCode !== 10 && typedSymbolCode === 13) {
      flashCursor();
      return;
    }

    // Change classes of passed characters
    currentChar.classList.remove("topass");
    if (typedSymbolCode === currentCharCode) {
      currentChar.classList.add("passed");
    } else {
      currentChar.classList.add("notpassed");
    }

    // If last symbol reached, hide cursor and show stats
    if (codeState.currentChar === codeState.lastChar) {
      cursor.classList.add("hide");
      document.getElementsByClassName("stats")[0].classList.remove("hide");
      window.scrollTo(0, document.body.scrollHeight);

      return;
    }

    // Else, get next symbol and set it as current
    const next = getNextChar();
    codeState = { ...codeState, currentChar: next };

    // Moving the cursor to the next position

    // If it's new line
    if (currentCharCode === 10 && typedSymbolCode === 13) {
      const linesLastCursorPositions = codeState.linesLastCursorPositions;
      linesLastCursorPositions.push(codeState.cursorLeftOffset);
      codeState = {
        ...codeState,
        cursorLeftOffset: 0,
        cursorTopOffset: codeState.cursorTopOffset + cursorHeight,
        linesLastCursorPositions,
        currentCharNum: codeState.currentCharNum + 1,
      };
      updateCursorPosition(
        codeState.cursorLeftOffset,
        codeState.cursorTopOffset
      );

      return;
    }

    // If tab symbol is reached
    if (currentCharCode === 9) {
      codeState = {
        ...codeState,
        cursorLeftOffset: codeState.cursorLeftOffset + cursorWidth,
        currentCharNum: codeState.currentCharNum + 1,
      };
      updateCursorPosition(
        codeState.cursorLeftOffset,
        codeState.cursorTopOffset
      );

      return;
    }

    // If it's the same line
    codeState = {
      ...codeState,
      cursorLeftOffset: codeState.cursorLeftOffset + cursorWidth,
      currentCharNum: codeState.currentCharNum + 1,
    };
    updateCursorPosition(codeState.cursorLeftOffset, codeState.cursorTopOffset);
  }

  // Function to update cursor position in the dom
  function updateCursorPosition(left, top) {
    cursor.style.left = `${left}px `;
    cursor.style.top = `${top}px`;
  }

  // Function to visually flash the cursor
  function flashCursor() {
    cursor.style.background = "#e05561";
    setTimeout(() => {
      cursor.style.background = "#8cc265";
    }, 100);
  }
})();
