import { ConfigurationTarget, window, commands, workspace } from "vscode";

/**
 * Register all the commands
 * @param WarmupWebview
 * @param context
 * @param words
 * @param codes
 */
export default function registerCommands(WarmupWebview, context, words, codes) {
  // Register start commandd
  context.subscriptions.push(
    commands.registerCommand("warmUp.start", () => {
      // Create or show WarmupWebview
      WarmupWebview.createOrShow(context.extensionUri);

      // Send all user settings to WarmupWebview to start
      if (WarmupWebview.currentPanel) {
        WarmupWebview.currentPanel.sendStartAndConfig(words, codes);
      }
    })
  );

  // Register practiceWithSelection command
  context.subscriptions.push(
    commands.registerCommand("warmUp.practiceWithSelection", () => {
      // Return if no editor open
      const editor = window.activeTextEditor;
      if (!editor) {
        return;
      }

      // Get selection
      const selections = editor.selections;
      let selectedCode = editor.document.getText(selections[0]);

      // Return if no selection
      if (selectedCode.length == 0) {
        return;
      }

      // Limit selection size
      selectedCode = selectedCode.substring(0, 3000);

      // Get editor file language
      let selectedCodeLanguage = window.activeTextEditor?.document.languageId;

      // Create or show WarmupWebview
      WarmupWebview.createOrShow(context.extensionUri);

      // Send all user settings to WarmupWebview to start with a selection
      if (WarmupWebview.currentPanel) {
        WarmupWebview.currentPanel.sendStartWithSelectionAndConfig(
          selectedCode,
          selectedCodeLanguage,
          words,
          codes
        );
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
            "turkish",
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

        // Send configuration change to WarmupWebview if it exists
        if (WarmupWebview.currentPanel) {
          WarmupWebview.currentPanel.sendConfigMessage(
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
            "python",
            "java",
            "csharp",
            "php",
            "typescript",
            "cpp",
            "c",
            "go",
            "kotlin",
            "ruby",
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

        // Send configuration change to WarmupWebview if it exists
        if (WarmupWebview.currentPanel) {
          WarmupWebview.currentPanel.sendConfigMessage(
            "switchProgrammingLanguage",
            userChoice
          );
        }
      }
    )
  );

  // Register changeTypingMode command
  context.subscriptions.push(
    commands.registerCommand(
      "warmUp.changeTypingMode",
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
            "warmUp.changeTypingMode",
            userChoice,
            ConfigurationTarget.Global
          );

        // Send configuration change to WarmupWebview if it exists
        if (WarmupWebview.currentPanel) {
          WarmupWebview.currentPanel.sendConfigMessage(
            "changeTypingMode",
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

        // Send configuration change to WarmupWebview if it exists
        if (WarmupWebview.currentPanel) {
          WarmupWebview.currentPanel.sendConfigMessage(
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

        // Send configuration change to WarmupWebview if it exists
        if (WarmupWebview.currentPanel) {
          WarmupWebview.currentPanel.sendConfigMessage(
            "changeCount",
            userChoice
          );
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

        // Send configuration change to WarmupWebview if it exists
        if (WarmupWebview.currentPanel) {
          WarmupWebview.currentPanel.sendConfigMessage(
            "toggleColorBlindMode",
            userChoice
          );
        }
      }
    )
  );
}
