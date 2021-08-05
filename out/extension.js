"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
// This script will be run within VS Code
// It can access the main VS Code APIs directly
const vscode_1 = require("vscode");
const panel_1 = require("./modules/panel");
const commands_1 = require("./modules/commands");
// Init status bar icon
let startButton;
// Function called after activation event
function activate(context) {
    // Fetch data from json file
    const fs = require("fs");
    const rawdata = fs.readFileSync(`${context.extensionPath}/webview/data.json`, "utf8");
    const data = JSON.parse(rawdata);
    const words = data.words;
    const codes = data.codes;
    // Add status bar icon
    startButton = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left, 1);
    startButton.command = "warmUp.start";
    startButton.tooltip = "Start typing test";
    startButton.text = `$(record-keys) Warm Up`;
    context.subscriptions.push(startButton);
    startButton.show();
    // Register all the commands
    commands_1.default(panel_1.default, context, words, codes);
    // Register webview panel serializer
    if (vscode_1.window.registerWebviewPanelSerializer) {
        // Make sure we register a serializer in activation event
        vscode_1.window.registerWebviewPanelSerializer(panel_1.default.viewType, {
            async deserializeWebviewPanel(webviewPanel, state) {
                // Reset the webview options so we use latest uri for `localResourceRoots`.
                webviewPanel.webview.options = {
                    enableScripts: true,
                    localResourceRoots: [vscode_1.Uri.joinPath(context.extensionUri, "webview")],
                };
                panel_1.default.revive(webviewPanel, context.extensionUri);
                // Send config
                if (panel_1.default.currentPanel) {
                    panel_1.default.currentPanel.sendStartAndConfig(words, codes);
                }
            },
        });
    }
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map