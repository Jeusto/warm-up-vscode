// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly
// @ts-nocheck

//const tinycolor = require("./tinycolor");

(function () {
  //====================================================
  // Global
  //====================================================
  const vscode = acquireVsCodeApi();

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data;

    // Message sent when the extension activates and sends settings
    if (message.type === "allConfig") {
      // Get current editor background color
      let editorBackgroundColor = tinycolor(
        getComputedStyle(root).getPropertyValue("--editorBackgroundColor")
      );
      let boxBackgroundColor = "";

      if (editorBackgroundColor.isLight()) {
        boxBackgroundColor = tinycolor(editorBackgroundColor)
          .darken(4)
          .toString();
      } else {
        boxBackgroundColor = tinycolor(editorBackgroundColor)
          .lighten(4)
          .toString();
      }

      root.style.setProperty("--boxBackgroundColor", boxBackgroundColor);

      // Put words list and settings into a state
      vscode.setState({
        allWords: message.words,
        allCodes: message.codes,
        language: message.language,
        codeLanguage: message.codeLanguage,
        count: message.count,
        mode: message.mode,
        punctuation: message.punctuation,
        colorBlindMode: message.colorBlindMode,
      });
      extensionState = vscode.getState();

      // Change words list and settings
      allWords = message.words;
      allCodes = message.codes;
      setLanguage(message.language);
      setCodeLanguage(message.codeLanguage);
      setWordCount(message.count);
      setTimeCount(message.count);
      setTypingMode(message.mode);
      setColorBlindMode(message.colorBlindMode);
      setPunctuation(message.punctuation);

      // Start typing test
      if (extensionState.mode === "code snippets") {
        setCodeText();
        showCodeText();
      } else {
        setText();
        showText();
      }
    } else if (message.type === "practiceWithSelection") {
      // Put words list and settings into a state
      vscode.setState({
        allWords: message.words,
        allCodes: message.codes,
        language: message.language,
        codeLanguage: message.codeLanguage,
        count: message.count,
        mode: message.mode,
        punctuation: message.punctuation,
        colorBlindMode: message.colorBlindMode,
      });
      extensionState = vscode.getState();

      // Change words list and settings
      allWords = message.words;
      allCodes = message.codes;
      setLanguage(message.language);
      setCodeLanguage(message.codeLanguage);
      setWordCount(message.count);
      setTimeCount(message.count);
      setTypingMode(message.mode);
      setColorBlindMode(message.colorBlindMode);
      setPunctuation(message.punctuation);

      // Start typing test
      setSelectedCodeText(message.selectedCode, message.selectedCodeLanguage);
      showCodeText();
    } else {
      // Message to change a single setting
      switch (message.config) {
        case "switchNaturalLanguage":
          if (message.value) {
            setLanguage(message.value);

            vscode.setState({ ...extensionState, language: message.value });
            extensionState = vscode.getState();

            if (extensionState.mode !== "code snippets") {
              setText();
              showText();
            }
          }
          break;

        case "switchProgrammingLanguage":
          if (message.value) {
            setCodeLanguage(message.value);

            vscode.setState({
              ...extensionState,
              codeLanguage: message.value,
            });
            extensionState = vscode.getState();

            if (extensionState.mode === "code snippets") {
              setCodeText();
              showCodeText();
            }
          }
          break;

        case "switchTypingMode":
          if (message.value) {
            vscode.setState({
              ...extensionState,
              mode: message.value,
            });
            extensionState = vscode.getState();

            gameOver = true;
            setTypingMode(message.value);
          }
          break;

        case "togglePunctuation":
          if (message.value) {
            setPunctuation(message.value);

            vscode.setState({
              ...extensionState,
              punctuation: message.value,
            });
            extensionState = vscode.getState();

            if (extensionState.mode !== "code snippets") {
              setText();
              showText();
            }
          }
          break;

        case "toggleColorBlindMode":
          setColorBlindMode(message.value);

          vscode.setState({ ...extensionState, colorBlindMode: message.value });
          extensionState = vscode.getState();
          break;

        case "changeCount":
          if (message.value) {
            setWordCount(message.value);
            setTimeCount(message.value);

            vscode.setState({
              ...extensionState,
              count: message.value,
            });
            extensionState = vscode.getState();

            if (extensionState.mode !== "code snippets") {
              setText();
              showText();
            }
          }
          break;

        default:
          break;
      }
    }
  });

  // Get document elements
  const textDisplay = document.querySelector("#text-display");
  const inputField = document.querySelector("#input-field");

  const cursor = document.getElementById("cursor");
  const root = document.documentElement;

  // Initialize dynamic variables
  let typingMode = "words (fixed amount)";

  let selectedLanguageWords = [];
  let currentWordsList = [];
  let currentWord = 0;
  let correctKeys = 0;
  let punctuation = false;
  let wordCount;
  let timeCount;
  let startDate = 0;
  let timerActive = false;
  let timer;

  let allCodes = [];
  let selectedLanguageCodes = [];
  let selectedLanguageName = "";
  let currentCode = "";
  let gameOver = true;
  let codeStartDate = 0;
  let codeState = {
    firstChar: null,
    lastChar: null,
    currentChar: null,
    currentCharNum: 0,
    cursorLeftOffset: 0,
    cursorTopOffset: 0,
    linesLastCursorPositions: [],
  };

  // Get all words and settings from the state if it exists
  let extensionState = vscode.getState();
  if (extensionState) {
    setLanguage(extensionState.language);
    setCodeLanguage(extensionState.codeLanguage);
    setWordCount(extensionState.count);
    setTimeCount(extensionState.count);
    setTypingMode(extensionState.mode);
    setColorBlindMode(extensionState.mode);
    setPunctuation(extensionState.punctuation);
    setText();
    showText();
  }

  // Restart if restart button hit
  document.querySelector("#restart-button").addEventListener("click", (e) => {
    setText(e);
    showText();
  });
  document.querySelector(".codeButton").addEventListener("click", (e) => {
    setCodeText(e);
    showCodeText();
  });

  // Restart if escape key hit
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (extensionState.mode === "code snippets") {
        setCodeText(e);
        showCodeText();
      } else {
        setText(e);
        showText();
      }
    }
  });

  // Function to change typing mode
  function setTypingMode(_mode) {
    const mode = _mode.toLowerCase();

    // Send message to extension to update setting
    vscode.postMessage({
      command: "switchTypingMode",
      mode: mode,
    });

    switch (mode) {
      case "words (fixed amount)":
        // Update ui
        document.querySelector("#coding-area").style.display = "none";
        document.querySelector("#time-count").style.display = "none";
        document.querySelector("#language-selected").style.display = "none";
        document.querySelector("#typing-area").style.display = "inline";
        document.querySelector("#word-count").style.display = "inline";

        // Start typing test
        setText();
        showText();

        break;

      case "words (against the clock)":
        // Update ui
        document.querySelector("#coding-area").style.display = "none";
        document.querySelector("#word-count").style.display = "none";
        document.querySelector("#language-selected").style.display = "none";
        document.querySelector("#typing-area").style.display = "inline";
        document.querySelector("#time-count").style.display = "inline";

        // Start typing test
        setText();
        showText();

        break;

      case "code snippets":
        // Update ui
        document.querySelector("#typing-area").style.display = "none";
        document.querySelector("#word-count").style.display = "none";
        document.querySelector("#time-count").style.display = "none";
        document.querySelector("#coding-area").style.display = "inline";
        document.querySelector("#language-selected").style.display = "inline";

        // Start typing test
        setCodeText();
        showCodeText();

        break;

      default:
        console.error(`Mode ${mode} is undefined`);
    }
  }

  // Function to change color blind mode
  function setColorBlindMode(_mode) {
    let body = document.querySelector("body");
    if (_mode === "true" && !body.classList.contains("colorblind")) {
      body.classList.add("colorblind");
    }
    if (_mode === "false" && body.classList.contains("colorblind")) {
      body.classList.remove("colorblind");
    }
  }

  //====================================================
  // Words mode
  //====================================================
  // Function to generate a new list of words
  function setText(e) {
    e = e || window.event;
    var keepWordList = e && e.shiftKey;

    // Reset
    if (!keepWordList) {
      currentWordsList = [];
    }
    currentWord = 0;
    correctKeys = 0;
    inputField.value = "";
    timerActive = false;
    clearTimeout(timer);
    textDisplay.style.display = "block";
    inputField.className = "";

    switch (extensionState.mode) {
      case "words (fixed amount)":
        textDisplay.style.height = "auto";

        textDisplay.innerHTML = "";
        if (!keepWordList) {
          currentWordsList = [];

          while (currentWordsList.length < wordCount) {
            const randomWord =
              selectedLanguageWords[
                Math.floor(Math.random() * selectedLanguageWords.length)
              ];
            if (
              currentWordsList[currentWordsList.length - 1] !== randomWord ||
              currentWordsList[currentWordsList.length - 1] === undefined
            ) {
              currentWordsList.push(randomWord);
            }
          }
        }
        break;

      case "words (against the clock)":
        textDisplay.style.height = "3.2rem";

        document.querySelector(`#tc-${timeCount}`).innerHTML = timeCount;

        textDisplay.innerHTML = "";
        if (!keepWordList) {
          currentWordsList = [];

          for (i = 0; i < 500; i++) {
            let n = Math.floor(Math.random() * selectedLanguageWords.length);

            currentWordsList.push(selectedLanguageWords[n]);
          }
        }
    }

    if (punctuation) addPunctuations();

    inputField.focus();
  }

  // Function to display a list of words
  function showText() {
    currentWordsList.forEach((word) => {
      let span = document.createElement("span");
      span.innerHTML = word + " ";

      textDisplay.appendChild(span);
    });

    textDisplay.firstChild.classList.add("highlight");
  }

  // Function to calculate and display result
  function showResult() {
    let words, minute, acc;
    switch (extensionState.mode) {
      case "words (fixed amount)":
        words = correctKeys / 5;
        minute = (Date.now() - startDate) / 1000 / 60;
        let totalKeys = -1;

        currentWordsList.forEach((e) => (totalKeys += e.length + 1));
        acc = Math.floor((correctKeys / totalKeys) * 100);
        break;

      case "words (against the clock)":
        words = correctKeys / 5;

        minute = timeCount / 60;
        let sumKeys = -1;

        for (i = 0; i < currentWord; i++) {
          sumKeys += currentWordsList[i].length + 1;
        }
        acc = acc = Math.min(Math.floor((correctKeys / sumKeys) * 100), 100);
    }

    let wpm = Math.floor(words / minute);

    document.querySelector(
      "#right-wing"
    ).innerHTML = `WPM: ${wpm} / ACC: ${acc}`;
  }

  // Key is pressed in input field (game logic)
  inputField.addEventListener("keydown", (e) => {
    // Add wrong class to input field
    switch (extensionState.mode) {
      case "words (fixed amount)":
        if (currentWord < currentWordsList.length) inputFieldClass();
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

        let currentWordSlice = currentWordsList[currentWord].slice(
          0,
          inputWordSlice.length
        );

        inputField.className =
          inputWordSlice === currentWordSlice ? "" : "wrong";
      } else if (e.key === "Backspace") {
        let inputWordSlice = e.ctrlKey
          ? ""
          : inputField.value.slice(0, inputField.value.length - 1);

        let currentWordSlice = currentWordsList[currentWord].slice(
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
      switch (extensionState.mode) {
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
        if (extensionState.mode === "words (against the clock)") {
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
        if (currentWord < currentWordsList.length - 1) {
          if (inputField.value === currentWordsList[currentWord]) {
            textDisplay.childNodes[currentWord].classList.add("correct");

            correctKeys += currentWordsList[currentWord].length + 1;
          } else {
            textDisplay.childNodes[currentWord].classList.add("wrong");
          }

          textDisplay.childNodes[currentWord + 1].classList.add("highlight");
        } else if (currentWord === currentWordsList.length - 1) {
          textDisplay.childNodes[currentWord].classList.add("wrong");
          showResult();
        }

        inputField.value = "";
        currentWord++;
      }

      // Else if it is the last word and input word is correct show the result
    } else if (currentWord === currentWordsList.length - 1) {
      if (inputField.value + e.key === currentWordsList[currentWord]) {
        textDisplay.childNodes[currentWord].classList.add("correct");

        correctKeys += currentWordsList[currentWord].length;
        currentWord++;
        showResult();
      }
    }
  });

  // Command center actions
  document.querySelector("#wc-15")?.addEventListener("click", () => {
    setWordCount(15);
    setText();
    showText();
  });
  document.querySelector("#wc-30")?.addEventListener("click", () => {
    setWordCount(30);
    setText();
    showText();
  });
  document.querySelector("#wc-60")?.addEventListener("click", () => {
    setWordCount(60);
    setText();
    showText();
  });
  document.querySelector("#wc-120")?.addEventListener("click", () => {
    setWordCount(120);
    setText();
    showText();
  });
  document.querySelector("#wc-240")?.addEventListener("click", () => {
    setWordCount(240);
    setText();
    showText();
  });
  document.querySelector("#tc-15")?.addEventListener("click", () => {
    setTimeCount(15);
    setText();
    showText();
  });
  document.querySelector("#tc-30")?.addEventListener("click", () => {
    setTimeCount(30);
    setText();
    showText();
  });
  document.querySelector("#tc-60")?.addEventListener("click", () => {
    setTimeCount(60);
    setText();
    showText();
  });
  document.querySelector("#tc-120")?.addEventListener("click", () => {
    setTimeCount(120);
    setText();
    showText();
  });
  document.querySelector("#tc-240")?.addEventListener("click", () => {
    setTimeCount(240);
    setText();
    showText();
  });

  // Function to add punctuation to a list of words
  function addPunctuations() {
    if (currentWordsList[0] !== undefined) {
      // Capitalize first word
      currentWordsList[0] =
        currentWordsList[0][0].toUpperCase() + currentWordsList[0].slice(1);

      // Add comma, fullstop, question mark, exclamation mark, semicolon. Capitalize the next word
      for (i = 0; i < currentWordsList.length; i++) {
        const ran = Math.random();

        if (i < currentWordsList.length - 1) {
          if (ran < 0.03) {
            currentWordsList[i] += ",";
          } else if (ran < 0.05) {
            currentWordsList[i] += ".";

            currentWordsList[i + 1] =
              currentWordsList[i + 1][0].toUpperCase() +
              currentWordsList[i + 1].slice(1);
          } else if (ran < 0.06) {
            currentWordsList[i] += "?";

            currentWordsList[i + 1] =
              currentWordsList[i + 1][0].toUpperCase() +
              currentWordsList[i + 1].slice(1);
          } else if (ran < 0.07) {
            currentWordsList[i] += "!";

            currentWordsList[i + 1] =
              currentWordsList[i + 1][0].toUpperCase() +
              currentWordsList[i + 1].slice(1);
          } else if (ran < 0.08) {
            currentWordsList[i] += ";";
          }
        }
      }
      currentWordsList[currentWordsList.length - 1] += ".";
    }
  }

  // Functions to change language setting
  function setLanguage(lang) {
    selectedLanguageWords = extensionState.allWords[lang];
  }

  // Function to change punctuation setting
  function setPunctuation(punct) {
    const punc = punct.toLowerCase();
    if (punc === "true") {
      punctuation = true;
    } else if (punc === "false") {
      punctuation = false;
    }
  }

  // Function to change word count setting
  function setWordCount(wc) {
    wordCount = wc;
    document
      .querySelectorAll("#word-count > span")
      .forEach((e) => (e.style.borderBottom = ""));
    document.querySelector(`#wc-${wordCount}`).style.borderBottom = "2px solid";

    // Change state
    vscode.setState({ ...extensionState, count: wordCount });
    extensionState = vscode.getState();

    // Send message to extension to update setting
    vscode.postMessage({
      command: "changeCount",
      count: wordCount,
    });
  }

  // Function to change time count setting
  function setTimeCount(tc) {
    timeCount = tc;
    document.querySelectorAll("#time-count > span").forEach((e) => {
      e.style.borderBottom = "";
      e.innerHTML = e.id.substring(3, 6);
    });
    document.querySelector(`#tc-${timeCount}`).style.borderBottom = "2px solid";

    // Change state
    vscode.setState({ ...extensionState, count: timeCount });
    extensionState = vscode.getState();

    // Send message to extension to update setting
    vscode.postMessage({
      command: "changeCount",
      count: timeCount,
    });
  }

  //====================================================
  // Code mode
  //====================================================
  // Function to set new code snippet and reset states
  function setCodeText(e) {
    document.querySelector("#language-selected").innerHTML =
      extensionState.codeLanguage.charAt(0).toUpperCase() +
      extensionState.codeLanguage.slice(1);

    e = e || window.event;
    var keepWordList = e && e.shiftKey;

    // Change code snippet if shift key is not hit
    if (!keepWordList) {
      currentCode =
        selectedLanguageCodes[
          Math.floor(Math.random() * selectedLanguageCodes.length)
        ];
    }

    // Reset progress state
    clearTimeout(timer);
    gameOver = false;
    codeState = {
      firstChar: null,
      lastChar: null,
      currentChar: null,
      currentCharNum: 0,
      cursorLeftOffset: 0,
      cursorTopOffset: 0,
      linesLastCursorPositions: [],
    };

    // Reset cursor position
    cursor.classList.remove("hidden");
    updateCursorPosition(0, 0);

    return;
  }

  // Function to set selection as new code snippet and reset states
  function setSelectedCodeText(selectedCode, selectedLanguage) {
    // Change code snippet
    currentCode = selectedCode;
    document.querySelector("#language-selected").innerHTML = selectedLanguage;

    // Reset progress state
    clearTimeout(timer);
    gameOver = false;
    codeState = {
      firstChar: null,
      lastChar: null,
      currentChar: null,
      currentCharNum: 0,
      cursorLeftOffset: 0,
      cursorTopOffset: 0,
      linesLastCursorPositions: [],
    };

    // Reset cursor position
    cursor.classList.remove("hidden");
    updateCursorPosition(0, 0);

    return;
  }

  // Function to show the code snippet in the dom
  function showCodeText() {
    highlightCode(currentCode, selectedLanguageName);

    // Update state with the correct characters
    updateStateChars();

    // Focus into it
    document.getElementById("coding-area").focus();
    return;
  }

  // Function to show end results for code snippets mode
  function showCodeResults() {
    let numberOfCharacters = document.querySelectorAll(".char").length;
    let numberOfCorrectTypings = document.querySelectorAll(".passed").length;

    let time = (Date.now() - codeStartDate) / 1000 / 60;
    let words = numberOfCorrectTypings / 5;

    let wpm = Math.floor(words / time);
    let acc = Math.floor((numberOfCorrectTypings / numberOfCharacters) * 100);

    document.querySelector(
      "#right-wing"
    ).innerHTML = `WPM: ${wpm} / ACC: ${acc}`;

    return;
  }

  // Retrieve cursor dimensions from css
  let cursorWidth =
    parseInt(
      getComputedStyle(root).getPropertyValue("--charSize").replace("px", "")
    ) * 0.601;
  let cursorHeight =
    parseInt(
      getComputedStyle(root).getPropertyValue("--charSize").replace("px", "")
    ) * 1.49;

  // Add event listeners for key presses
  document.addEventListener("keydown", (e) => handleKeyDown(e));
  document.addEventListener("keypress", (e) => handleKeyPress(e));

  // Function to set code language
  function setCodeLanguage(lang) {
    selectedLanguageName = lang;
    selectedLanguageCodes = allCodes[lang];
    return;
  }

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

  // Function that sets highlighted code in dom
  function highlightCode(codeSnippet, language) {
    codeDiv = document.getElementById("code-code");

    document.getElementById("code-pre").className = "";
    document.getElementById("code-code").className = "";

    codeDiv.classList.add(`language-${language}`);
    codeDiv.innerHTML = codeSnippet;

    Prism.highlightElement(codeDiv);

    codeDiv.innerHTML = cutCodeIntoPieces(codeDiv.innerHTML);
  }

  // Function that cuts highlighted code into spans of characters
  function cutCodeIntoPieces(highlightedCode) {
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
    if (gameOver) {
      e.submit();
    }

    // If it's the first character, start timer
    if (codeState.currentCharNum === 0) {
      codeStartDate = Date.now();
    }

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
    if (gameOver) {
      e.submit();
    }

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

    // Change class depending if you typed correct or wrong
    if (typedSymbolCode === currentCharCode) {
      currentChar.classList.add("passed");
    } else {
      currentChar.classList.add("notpassed");
    }

    // If last symbol reached, hide cursor and show stats
    if (codeState.currentChar === codeState.lastChar) {
      cursor.classList.add("hidden");

      showCodeResults();
      gameOver = true;
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
    cursor.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });
  }

  // Function to visually flash the cursor
  function flashCursor() {
    cursor.style.background = "#e0556170";
    setTimeout(() => {
      cursor.style.background = "#5dbeff";
    }, 100);
  }
})();
