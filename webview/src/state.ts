type ColorblindMode = "disabled" | "protanopia" | "deuteranopia" | "tritanopia";
type ColorblindModeOld = "true" | "false";

type TypingMode = "words" | "time" | "code";
type TypingModeOld =
  | "words (fixed amount)"
  | "words (against the clock)"
  | "code snippets";

interface ExtensionState {
  language: string;
  codeLanguage: string;
  wordCount: number;
  timeCount: number;
  typingMode: TypingModeOld;
  colorblindMode: ColorblindModeOld;
  punctuation: boolean;
}

interface GameState {
  selectLanguageWords: string[];
  currentWordsList: string[];
  currentWordIndex: number;
  correctKeys: number;
  punctuationIsEnabled: boolean;
  wordCount: number;
  timeCount: number;
  startDate: number;
  timerActive: boolean;
  timer: number;
}

interface EditorState {
  allWords: string[];
  allCodes: string[];
  selectedLanguageCodes: string[];
  selectedLanguageName: string;
  currentCode: string;
  gameOver: boolean;
  codeStartDate: number;
  codeState: {
    firstChar: string | null;
    lastChar: string | null;
    currentChar: string | null;
    currentCharNum: number;
    cursorLeftOffset: number;
    cursorTopOffset: number;
    linesLastCursorPositions: number[];
  };
}

function initGameState(): GameState {}

function initEditorState(): EditorState {}

function setTypingMode() {}
function setColorblindMode() {}
function setLanguage() {}
function togglePunctuation() {}
function setWordCount() {}
function setTimeCount() {}
function setProgrammingLanguage() {}
