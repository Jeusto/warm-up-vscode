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

// Init the status bar icon
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

  // Register switchLanguage command
  context.subscriptions.push(
    commands.registerCommand(
      "warmUp.switchLanguage",
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
            placeHolder: "Choose a specific language to practice with.",
          }
        );

        // Update the configuration value with user choice
        await workspace
          .getConfiguration()
          .update(
            "warmUp.switchLanguage",
            userChoice,
            ConfigurationTarget.Global
          );

        // Send message to webview if it exists
        if (WarmUpPanel.currentPanel) {
          WarmUpPanel.currentPanel.sendConfigMessage(
            "switchLanguage",
            userChoice
          );
        }
      }
    )
  );

  // Register switchCodeLanguage command
  context.subscriptions.push(
    commands.registerCommand(
      "warmUp.switchCodeLanguage",
      async function showQuickPick() {
        const userChoice = await window.showQuickPick(
          ["javascript", "python"],
          {
            placeHolder:
              "Choose a specific programming language to practice with.",
          }
        );

        // Update the configuration value with user choice
        await workspace
          .getConfiguration()
          .update(
            "warmUp.switchCodeLanguage",
            userChoice,
            ConfigurationTarget.Global
          );

        // Send message to webview if it exists
        if (WarmUpPanel.currentPanel) {
          WarmUpPanel.currentPanel.sendConfigMessage(
            "switchCodeLanguage",
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
        const userChoice = await window.showQuickPick(
          [
            "words (fixed amount)",
            "words (against the clock)",
            "code snippets",
          ],
          {
            placeHolder:
              "Practice with a fixed amount of words, against the clock or with code snippets.",
          }
        );

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
        const userChoice = await window.showQuickPick(["false", "true"], {
          placeHolder:
            'Enable or disable punctuation (doesn\'t concern "code snippets" mode).',
        });

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
              'Change the amount of words or the clock timer (doesn\'t concern "code snippets" mode).',
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
