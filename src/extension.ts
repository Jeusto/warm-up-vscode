// This script will be run within VS Code
// It can access the main VS Code APIs directly
import {
  Uri,
  WebviewPanel,
  StatusBarItem,
  ExtensionContext,
  ConfigurationTarget,
  StatusBarAlignment,
  window,
  commands,
  workspace,
} from "vscode";

import WarmUpPanel from "./webviewPanel/webviewPanel";

// Init status bar icon
let myStatusBarItem: StatusBarItem;

// Function called after activation event
export function activate(context: ExtensionContext) {
  // Fetch words from json file
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require("fs");
  const rawdata = fs.readFileSync(
    `${context.extensionPath}/media/words.json`,
    "utf8"
  );
  const data = JSON.parse(rawdata);
  const words = data.words;
  const codes = data.codes;

  // Add status bar icon
  myStatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 1);
  myStatusBarItem.command = "warmUp.start";
  myStatusBarItem.tooltip = "Start typing test";
  myStatusBarItem.text = `$(record-keys) Warm Up`;
  context.subscriptions.push(myStatusBarItem);

  // Display status bar icon
  myStatusBarItem.show();

  // Register start command and do stuff
  context.subscriptions.push(
    commands.registerCommand("warmUp.start", () => {
      // Create or show webview
      WarmUpPanel.createOrShow(context.extensionUri);
      // Send all user settings with message
      if (WarmUpPanel.currentPanel) {
        WarmUpPanel.currentPanel.sendAllConfigMessage(words, codes);
      }
    })
  );

  // Register switchNaturalLanguage command
  context.subscriptions.push(
    commands.registerCommand(
      "warmUp.switchNaturalLanguage",
      async function showQuickPick() {
        const userChoice = await window.showQuickPick(
          [
            "english",
            "italian",
            "german",
            "spanish",
            "chinese",
            "korean",
            "polish",
            "swedish",
            "french",
            "portuguese",
            "russian",
            "finnish",
            "englishTop1000",
          ],
          {
            placeHolder: "Choose a natural language to practice with.",
          }
        );

        // Update the configuration value with user choice
        await workspace
          .getConfiguration()
          .update(
            "warmUp.switchNaturalLanguage",
            userChoice,
            ConfigurationTarget.Global
          );

        // Send message to webview if it exists
        if (WarmUpPanel.currentPanel) {
          WarmUpPanel.currentPanel.sendConfigMessage(
            "switchNaturalLanguage",
            userChoice
          );
        }
      }
    )
  );

  // Register switchProgrammingLanguage command
  context.subscriptions.push(
    commands.registerCommand(
      "warmUp.switchProgrammingLanguage",
      async function showQuickPick() {
        const userChoice = await window.showQuickPick(
          [
            "javascript",
            "html",
            "css",
            "sql",
            "python",
            "java",
            "c#",
            "typescript",
            "c++",
            "c",
            "go",
            "rust",
          ],
          {
            placeHolder: "Choose a programming language to practice with.",
          }
        );

        // Update the configuration value with user choice
        await workspace
          .getConfiguration()
          .update(
            "warmUp.switchProgrammingLanguage",
            userChoice,
            ConfigurationTarget.Global
          );

        // Send message to webview if it exists
        if (WarmUpPanel.currentPanel) {
          WarmUpPanel.currentPanel.sendConfigMessage(
            "switchProgrammingLanguage",
            userChoice
          );
        }
      }
    )
  );

  // Register switchTypingMode command
  context.subscriptions.push(
    commands.registerCommand(
      "warmUp.switchTypingMode",
      async function showQuickPick() {
        // Get user choice
        let userChoice = await window.showQuickPick(
          [
            "$(book) words (fixed amount)",
            "$(watch) words (against the clock)",
            "$(code) code snippets",
          ],
          {
            placeHolder:
              "Practice a fixed amount of words, against the clock or with code snippets.",
          }
        );
        if (userChoice === "$(book) words (fixed amount)") {
          userChoice = "words (fixed amount)";
        } else if (userChoice === "$(watch) words (against the clock)") {
          userChoice = "words (against the clock)";
        } else if (userChoice === "$(code) code snippets") {
          userChoice = "code snippets";
        }

        // Update the configuration value with user choice
        await workspace
          .getConfiguration()
          .update(
            "warmUp.switchTypingMode",
            userChoice,
            ConfigurationTarget.Global
          );

        // Send message to webview if it exists
        if (WarmUpPanel.currentPanel) {
          WarmUpPanel.currentPanel.sendConfigMessage(
            "switchTypingMode",
            userChoice
          );
        }
      }
    )
  );

  // Register togglePunctuation command
  context.subscriptions.push(
    commands.registerCommand(
      "warmUp.togglePunctuation",
      async function showQuickPick() {
        // Get user choice
        let userChoice = await window.showQuickPick(
          ["$(circle-slash) false", "$(check) true"],
          {
            placeHolder:
              'Enable or disable punctuation (doesn\'t affect "code snippets" mode).',
          }
        );

        if (userChoice === "$(circle-slash) false") {
          userChoice = "false";
        } else if (userChoice === "$(check) true") {
          userChoice = "true";
        }

        // Update the configuration value with user choice
        await workspace
          .getConfiguration()
          .update(
            "warmUp.togglePunctuation",
            userChoice,
            ConfigurationTarget.Global
          );

        // Send message to webview if it exists
        if (WarmUpPanel.currentPanel) {
          WarmUpPanel.currentPanel.sendConfigMessage(
            "togglePunctuation",
            userChoice
          );
        }
      }
    )
  );

  // Register changeCount command
  context.subscriptions.push(
    commands.registerCommand(
      "warmUp.changeCount",
      async function showQuickPick() {
        // Get user choice
        const userChoice = await window.showQuickPick(
          ["15", "30", "60", "120", "240"],
          {
            placeHolder:
              'Change the amount of words or the timer (doesn\'t affect "code snippets" mode).',
          }
        );

        // Update the configuration value with user choice
        await workspace
          .getConfiguration()
          .update("warmUp.changeCount", userChoice, ConfigurationTarget.Global);

        // Send message to webview if it exists
        if (WarmUpPanel.currentPanel) {
          WarmUpPanel.currentPanel.sendConfigMessage("changeCount", userChoice);
        }
      }
    )
  );

  // Register toggleColorBlind command
  context.subscriptions.push(
    commands.registerCommand(
      "warmUp.toggleColorBlindMode",
      async function showQuickPick() {
        // Get user choice
        let userChoice = await window.showQuickPick(
          ["$(circle-slash) false", "$(check) true"],
          {
            placeHolder:
              'Enable or disable color blind mode (doesn\'t affect "code snippets" mode).',
          }
        );

        if (userChoice === "$(circle-slash) false") {
          userChoice = "false";
        } else if (userChoice === "$(check) true") {
          userChoice = "true";
        }

        // Update the configuration value with user choice
        await workspace
          .getConfiguration()
          .update(
            "warmUp.toggleColorBlindMode",
            userChoice,
            ConfigurationTarget.Global
          );

        // Send message to webview if it exists
        if (WarmUpPanel.currentPanel) {
          WarmUpPanel.currentPanel.sendConfigMessage(
            "toggleColorBlindMode",
            userChoice
          );
        }
      }
    )
  );

  // Register practiceWithSelection command
  context.subscriptions.push(
    commands.registerCommand("warmUp.practiceWithSelection", () => {
      const editor = window.activeTextEditor;
      if (!editor) {
        // No open text editor, return
        return;
      }

      const selections = editor.selections;
      let firstSelection = editor.document.getText(selections[0]);

      // No selection, return
      if (firstSelection.length == 0) {
        return;
      }

      firstSelection = firstSelection.substring(0, 2000);

      // Create or show webview
      WarmUpPanel.createOrShow(context.extensionUri);
      // Send all user settings with message
      if (WarmUpPanel.currentPanel) {
        WarmUpPanel.currentPanel.sendPracticeWithSelection(firstSelection);
      }
    })
  );

  // Register webview panel serializer
  if (window.registerWebviewPanelSerializer) {
    // Make sure we register a serializer in activation event
    window.registerWebviewPanelSerializer(WarmUpPanel.viewType, {
      async deserializeWebviewPanel(webviewPanel: WebviewPanel, state: any) {
        // Reset the webview options so we use latest uri for `localResourceRoots`.
        webviewPanel.webview.options = {
          enableScripts: true,
          localResourceRoots: [Uri.joinPath(context.extensionUri, "media")],
        };
        WarmUpPanel.revive(webviewPanel, context.extensionUri);
      },
    });
  }
}
