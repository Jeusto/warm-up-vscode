// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
  const vscode = acquireVsCodeApi();

  const oldState = /** @type {{ count: number} | undefined} */ (
    vscode.getState()
  );

  const counter = /** @type {HTMLElement} */ (
    document.getElementById("lines-of-code-counter")
  );
  console.log("Initial state", oldState);

  let currentCount = (oldState && oldState.count) || 0;
  counter.textContent = `${currentCount}`;

  setInterval(() => {
    counter.textContent = `${currentCount++} `;

    // Update state
    vscode.setState({ count: currentCount });

    // // Alert the extension when the cat introduces a bug
    // if (Math.random() < Math.min(0.001 * currentCount, 0.05)) {
    //   // Send a message back to the extension
    //   vscode.postMessage({
    //     command: "alert",
    //     text: "🐛  on line " + currentCount,
    //   });
    // }
  }, 100);

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.command) {
      case "refactor":
        currentCount = Math.ceil(currentCount * 0.5);
        counter.textContent = `${currentCount}`;
        break;
    }
  });

  // Get document element
  const textDisplay = document.querySelector("#text-display");
  const inputField = document.querySelector("#input-field");

  // Initialize typing mode variables
  let typingMode = "wordcount";
  // @ts-ignore
  let wordCount;
  // @ts-ignore
  let timeCount;

  // Initialize dynamic variables
  // @ts-ignore
  let randomWords = [];
  // @ts-ignore
  let wordList = [];
  let currentWord = 0;
  let correctKeys = 0;
  let startDate = 0;
  // @ts-ignore
  let timer;
  let timerActive = false;
  let punctuation = false;

  // Get cookies
  setLanguage("french");
  setWordCount(10);
  setTimeCount(60);
  setTypingMode("wordcount");
  setPunctuation("false");

  // Find a list of words and display it to textDisplay
  // @ts-ignore
  function setText(e) {
    e = e || window.event;
    var keepWordList = e && e.shiftKey;

    // Reset
    if (!keepWordList) {
      wordList = [];
    }
    currentWord = 0;
    correctKeys = 0;
    // @ts-ignore
    inputField.value = "";
    timerActive = false;
    // @ts-ignore
    clearTimeout(timer);
    // @ts-ignore
    textDisplay.style.display = "block";
    // @ts-ignore
    inputField.className = "";

    switch (typingMode) {
      case "wordcount":
        // @ts-ignore
        textDisplay.style.height = "auto";
        // @ts-ignore
        textDisplay.innerHTML = "";
        if (!keepWordList) {
          wordList = [];
          // @ts-ignore
          while (wordList.length < wordCount) {
            const randomWord =
              // @ts-ignore
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
        // @ts-ignore
        textDisplay.style.height = "3.2rem";
        // @ts-ignore
        document.querySelector(`#tc-${timeCount}`).innerHTML = timeCount;
        // @ts-ignore
        textDisplay.innerHTML = "";
        if (!keepWordList) {
          wordList = [];
          // @ts-ignore
          for (i = 0; i < 500; i++) {
            let n = Math.floor(Math.random() * randomWords.length);
            // @ts-ignore
            wordList.push(randomWords[n]);
          }
        }
    }

    if (punctuation) addPunctuations();
    showText();
    // @ts-ignore
    inputField.focus();
  }

  function addPunctuations() {
    // @ts-ignore
    if (wordList[0] !== undefined) {
      // Capitalize first word
      // @ts-ignore
      wordList[0] = wordList[0][0].toUpperCase() + wordList[0].slice(1);

      // Add comma, fullstop, question mark, exclamation mark, semicolon. Capitalize the next word
      // @ts-ignore
      for (i = 0; i < wordList.length; i++) {
        const ran = Math.random();
        // @ts-ignore
        if (i < wordList.length - 1) {
          if (ran < 0.03) {
            // @ts-ignore
            wordList[i] += ",";
          } else if (ran < 0.05) {
            // @ts-ignore
            wordList[i] += ".";
            // @ts-ignore
            wordList[i + 1] =
              // @ts-ignore
              wordList[i + 1][0].toUpperCase() + wordList[i + 1].slice(1);
          } else if (ran < 0.06) {
            // @ts-ignore
            wordList[i] += "?";
            // @ts-ignore
            wordList[i + 1] =
              // @ts-ignore
              wordList[i + 1][0].toUpperCase() + wordList[i + 1].slice(1);
          } else if (ran < 0.07) {
            // @ts-ignore
            wordList[i] += "!";
            // @ts-ignore
            wordList[i + 1] =
              // @ts-ignore
              wordList[i + 1][0].toUpperCase() + wordList[i + 1].slice(1);
          } else if (ran < 0.08) {
            // @ts-ignore
            wordList[i] += ";";
          }
        }
      }
      // @ts-ignore
      wordList[wordList.length - 1] += ".";

      // Add quotation marks
    }
  }

  // Display text to textDisplay
  function showText() {
    // @ts-ignore
    wordList.forEach((word) => {
      let span = document.createElement("span");
      span.innerHTML = word + " ";
      // @ts-ignore
      textDisplay.appendChild(span);
    });
    // @ts-ignore
    textDisplay.firstChild.classList.add("highlight");
  }

  // Key is pressed in input field
  // @ts-ignore
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
        // @ts-ignore
        (e.key >= "a" && e.key <= "z") ||
        // @ts-ignore
        e.key === `'` ||
        // @ts-ignore
        e.key === "," ||
        // @ts-ignore
        e.key === "." ||
        // @ts-ignore
        e.key === ";"
      ) {
        // @ts-ignore
        let inputWordSlice = inputField.value + e.key;
        // @ts-ignore
        let currentWordSlice = wordList[currentWord].slice(
          0,
          inputWordSlice.length
        );
        // @ts-ignore
        inputField.className =
          inputWordSlice === currentWordSlice ? "" : "wrong";
        // @ts-ignore
      } else if (e.key === "Backspace") {
        // @ts-ignore
        let inputWordSlice = e.ctrlKey
          ? ""
          : // @ts-ignore
            inputField.value.slice(0, inputField.value.length - 1);
        // @ts-ignore
        let currentWordSlice = wordList[currentWord].slice(
          0,
          inputWordSlice.length
        );
        // @ts-ignore
        inputField.className =
          inputWordSlice === currentWordSlice ? "" : "wrong";
        // @ts-ignore
      } else if (e.key === " ") {
        // @ts-ignore
        inputField.className = "";
      }
    }

    // If it is the first character entered
    // @ts-ignore
    if (currentWord === 0 && inputField.value === "") {
      switch (typingMode) {
        case "wordcount":
          startDate = Date.now();
          break;

        case "time":
          if (!timerActive) {
            // @ts-ignore
            startTimer(timeCount);
            timerActive = true;
          }
          // @ts-ignore
          function startTimer(time) {
            if (time > 0) {
              // @ts-ignore
              document.querySelector(`#tc-${timeCount}`).innerHTML = time;
              timer = setTimeout(() => {
                time--;
                startTimer(time);
              }, 1000);
            } else {
              timerActive = false;
              // @ts-ignore
              textDisplay.style.display = "none";
              // @ts-ignore
              inputField.className = "";
              // @ts-ignore
              document.querySelector(`#tc-${timeCount}`).innerHTML = timeCount;
              showResult();
            }
          }
      }
    }

    // If it is the space key check the word and add correct/wrong class
    // @ts-ignore
    if (e.key === " ") {
      e.preventDefault();

      // @ts-ignore
      if (inputField.value !== "") {
        // Scroll down text when reach new line
        if (typingMode === "time") {
          const currentWordPosition =
            // @ts-ignore
            textDisplay.childNodes[currentWord].getBoundingClientRect();
          const nextWordPosition =
            // @ts-ignore
            textDisplay.childNodes[currentWord + 1].getBoundingClientRect();
          if (currentWordPosition.top < nextWordPosition.top) {
            // @ts-ignore
            for (i = 0; i < currentWord + 1; i++)
              // @ts-ignore
              textDisplay.childNodes[i].style.display = "none";
          }
        }

        // If it is not the last word increment currentWord,
        if (currentWord < wordList.length - 1) {
          // @ts-ignore
          if (inputField.value === wordList[currentWord]) {
            // @ts-ignore
            textDisplay.childNodes[currentWord].classList.add("correct");
            // @ts-ignore
            correctKeys += wordList[currentWord].length + 1;
          } else {
            // @ts-ignore
            textDisplay.childNodes[currentWord].classList.add("wrong");
          }
          // @ts-ignore
          textDisplay.childNodes[currentWord + 1].classList.add("highlight");
        } else if (currentWord === wordList.length - 1) {
          // @ts-ignore
          textDisplay.childNodes[currentWord].classList.add("wrong");
          showResult();
        }

        // @ts-ignore
        inputField.value = "";
        currentWord++;
      }

      // Else if it is the last word and input word is correct show the result
    } else if (currentWord === wordList.length - 1) {
      // @ts-ignore
      if (inputField.value + e.key === wordList[currentWord]) {
        // @ts-ignore
        textDisplay.childNodes[currentWord].classList.add("correct");
        // @ts-ignore
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
        // @ts-ignore
        wordList.forEach((e) => (totalKeys += e.length + 1));
        acc = Math.floor((correctKeys / totalKeys) * 100);
        break;

      case "time":
        words = correctKeys / 5;
        // @ts-ignore
        minute = timeCount / 60;
        let sumKeys = -1;
        // @ts-ignore
        for (i = 0; i < currentWord; i++) {
          // @ts-ignore
          sumKeys += wordList[i].length + 1;
        }
        acc = acc = Math.min(Math.floor((correctKeys / sumKeys) * 100), 100);
    }
    // @ts-ignore
    let wpm = Math.floor(words / minute);
    // @ts-ignore
    document.querySelector(
      "#right-wing"
    ).innerHTML = `WPM: ${wpm} / ACC: ${acc}`;
  }

  // Command actions
  document.addEventListener("keydown", (e) => {
    // Modifiers Windows: [Alt], Mac: [Cmd + Ctrl]
    if (e.altKey || (e.metaKey && e.ctrlKey)) {
      // [mod + l] => Change the language
      if (e.key === "l") {
        // @ts-ignore
        setLanguage(inputField.value);
      }

      // [mod + m] => Change the typing mode
      if (e.key === "m") {
        // @ts-ignore
        setTypingMode(inputField.value);
      }

      // [mod + p] => Change punctuation active
      if (e.key === "p") {
        // @ts-ignore
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

  // Redo button action
  // @ts-ignore
  document.querySelector("#redo-button").addEventListener("click", (e) => {
    setText(e);
  });

  // Functions
  // @ts-ignore
  function setLanguage(_lang) {
    randomWords = ["bonjour", "salut", "hello", "hey", "hi", "yo"];
    // const lang = _lang.toLowerCase();
    // fetch("https://reqres.in/api/users?page=2")
    //   .then((response) => response.json())
    //   .then((json) => {
    //     console.log(json);
    //     if (typeof json[lang] !== "undefined") {
    //       randomWords = json[lang];

    //       if (lang === "arabic") {
    //         // @ts-ignore
    //         textDisplay.style.direction = "rtl";
    //         // @ts-ignore
    //         inputField.style.direction = "rtl";
    //       } else {
    //         // @ts-ignore
    //         textDisplay.style.direction = "ltr";
    //         // @ts-ignore
    //         inputField.style.direction = "ltr";
    //       }

    //       setText();
    //     } else {
    //       console.error(`language ${lang} is undefine`);
    //     }
    //   })
    //   .catch((err) => console.error(err));
  }

  // @ts-ignore
  function setTypingMode(_mode) {
    const mode = _mode.toLowerCase();
    switch (mode) {
      case "wordcount":
        typingMode = mode;
        // @ts-ignore
        document.querySelector("#word-count").style.display = "inline";
        // @ts-ignore
        document.querySelector("#time-count").style.display = "none";
        setText();
        break;
      case "time":
        typingMode = mode;
        // @ts-ignore
        document.querySelector("#word-count").style.display = "none";
        // @ts-ignore
        document.querySelector("#time-count").style.display = "inline";
        setText();
        break;
      default:
        console.error(`mode ${mode} is undefine`);
    }
  }

  // @ts-ignore
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

  // @ts-ignore
  function setWordCount(wc) {
    wordCount = wc;
    document
      .querySelectorAll("#word-count > span")
      // @ts-ignore
      .forEach((e) => (e.style.borderBottom = ""));
    // @ts-ignore
    document.querySelector(`#wc-${wordCount}`).style.borderBottom = "2px solid";
    setText();
  }

  // @ts-ignore
  function setTimeCount(tc) {
    timeCount = tc;
    document.querySelectorAll("#time-count > span").forEach((e) => {
      // @ts-ignore
      e.style.borderBottom = "";
      e.innerHTML = e.id.substring(3, 6);
    });
    // @ts-ignore
    document.querySelector(`#tc-${timeCount}`).style.borderBottom = "2px solid";
    setText();
  }
})();
