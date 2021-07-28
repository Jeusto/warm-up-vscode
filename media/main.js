// @ts-nocheck
// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
  const vscode = acquireVsCodeApi();

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.command) {
      case "switchLanguage":
        break;
    }
  });

  // Get document element
  const textDisplay = document.querySelector("#text-display");
  const inputField = document.querySelector("#input-field");

  // Initialize typing mode variables
  let typingMode = "wordcount";
  let wordCount;
  let timeCount;

  // Initialize dynamic variables
  let randomWords = [];
  let wordList = [];
  let currentWord = 0;
  let correctKeys = 0;
  let startDate = 0;
  let timer;
  let timerActive = false;
  let punctuation = false;

  // Set settings
  setLanguage("french");
  setWordCount(10);
  setTimeCount(15);
  setTypingMode("wordcount");
  setPunctuation("false");

  // Find a list of words and display it to textDisplay
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
      case "wordcount":
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

      case "time":
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

  // Display text to textDisplay
  function showText() {
    wordList.forEach((word) => {
      let span = document.createElement("span");
      span.innerHTML = word + " ";

      textDisplay.appendChild(span);
    });

    textDisplay.firstChild.classList.add("highlight");
  }

  // Key is pressed in input field
  inputField.addEventListener("keydown", (e) => {
    // Add wrong class to input field
    switch (typingMode) {
      case "wordcount":
        if (currentWord < wordList.length) inputFieldClass();
      case "time":
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
        case "wordcount":
          startDate = Date.now();
          break;

        case "time":
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
        if (typingMode === "time") {
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

  // Calculate and display result
  function showResult() {
    let words, minute, acc;
    switch (typingMode) {
      case "wordcount":
        words = correctKeys / 5;
        minute = (Date.now() - startDate) / 1000 / 60;
        let totalKeys = -1;

        wordList.forEach((e) => (totalKeys += e.length + 1));
        acc = Math.floor((correctKeys / totalKeys) * 100);
        break;

      case "time":
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

  // Redo button action
  document.querySelector("#redo-button").addEventListener("click", (e) => {
    setText(e);
  });

  // Command actions
  document.addEventListener("keydown", (e) => {
    // Modifiers Windows: [Alt], Mac: [Cmd + Ctrl]
    if (e.altKey || (e.metaKey && e.ctrlKey)) {
      // [mod + l] => Change the language
      if (e.key === "l") {
        setLanguage(inputField.value);
      }

      // [mod + m] => Change the typing mode
      if (e.key === "m") {
        setTypingMode(inputField.value);
      }

      // [mod + p] => Change punctuation active
      if (e.key === "p") {
        setPunctuation(inputField.value);
      }
    } else if (e.key === "Escape") {
      setText(e);
    }
  });

  // Command center actions
  document.querySelector("#wc-10")?.addEventListener("click", () => {
    setWordCount(10);
  });
  document.querySelector("#wc-25")?.addEventListener("click", () => {
    setWordCount(25);
  });
  document.querySelector("#wc-50")?.addEventListener("click", () => {
    setWordCount(50);
  });
  document.querySelector("#wc-100")?.addEventListener("click", () => {
    setWordCount(100);
  });
  document.querySelector("#wc-250")?.addEventListener("click", () => {
    setWordCount(250);
  });
  document.querySelector("#wc-15")?.addEventListener("click", () => {
    setTimeCount(15);
  });
  document.querySelector("#wc-30")?.addEventListener("click", () => {
    setTimeCount(30);
  });
  document.querySelector("#wc-60")?.addEventListener("click", () => {
    setTimeCount(60);
  });
  document.querySelector("#wc-120")?.addEventListener("click", () => {
    setTimeCount(120);
  });
  document.querySelector("#wc-240")?.addEventListener("click", () => {
    setTimeCount(240);
  });

  // Functions
  function setLanguage(_lang) {
    document.getElementById("header").innerHTML = random.french[0];
    randomWords = random.english;
  }

  function setTypingMode(_mode) {
    const mode = _mode.toLowerCase();
    switch (mode) {
      case "wordcount":
        typingMode = mode;

        document.querySelector("#word-count").style.display = "inline";

        document.querySelector("#time-count").style.display = "none";
        setText();
        break;
      case "time":
        typingMode = mode;

        document.querySelector("#word-count").style.display = "none";

        document.querySelector("#time-count").style.display = "inline";
        setText();
        break;
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
  }

  function setTimeCount(tc) {
    timeCount = tc;
    document.querySelectorAll("#time-count > span").forEach((e) => {
      e.style.borderBottom = "";
      e.innerHTML = e.id.substring(3, 6);
    });

    document.querySelector(`#tc-${timeCount}`).style.borderBottom = "2px solid";
    setText();
  }
})();
