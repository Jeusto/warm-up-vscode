// This script will be run within VS Code
// It can access the main VS Code APIs directly
import {
  Uri,
  WebviewPanel,
  StatusBarItem,
  ExtensionContext,
  StatusBarAlignment,
  window,
} from "vscode";

import WarmupWebview from "./modules/panel";
import registerCommands from "./modules/commands";

// Init status bar icon
let startButton: StatusBarItem;

// Function called after activation event
export function activate(context: ExtensionContext) {
  // Fetch data from json file
  const fs = require("fs");
  const rawdata = fs.readFileSync(
    `${context.extensionPath}/webview/data.json`,
    "utf8"
  );
  const data = JSON.parse(rawdata);
  const words = data.words;
  const codes = data.codes;

  // Add status bar icon
  startButton = window.createStatusBarItem(StatusBarAlignment.Left, 1);
  startButton.command = "warmUp.start";
  startButton.tooltip = "Start typing test";
  startButton.text = `$(record-keys) Warm Up`;

  context.subscriptions.push(startButton);
  startButton.show();

  // Register all the commands
  registerCommands(WarmupWebview, context, words, codes);

  // Register webview panel serializer
  if (window.registerWebviewPanelSerializer) {
    // Make sure we register a serializer in activation event
    window.registerWebviewPanelSerializer(WarmupWebview.viewType, {
      async deserializeWebviewPanel(webviewPanel: WebviewPanel, state: any) {
        // Reset the webview options so we use latest uri for `localResourceRoots`.
        webviewPanel.webview.options = {
          enableScripts: true,
          localResourceRoots: [Uri.joinPath(context.extensionUri, "webview")],
        };
        WarmupWebview.revive(webviewPanel, context.extensionUri);

        // Send config
        if (WarmupWebview.currentPanel) {
          WarmupWebview.currentPanel.sendStartAndConfig(words, codes);
        }
      },
    });
  }
}
