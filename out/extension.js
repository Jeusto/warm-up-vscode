"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
// This script will be run within VS Code
// It can access the main VS Code APIs directly
const vscode_1 = require("vscode");
const webviewPanel_1 = require("./webviewPanel/webviewPanel");
// Init status bar icon
let myStatusBarItem;
// Function called after activation event
function activate(context) {
    // Fetch words from json file
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("fs");
    const rawdata = fs.readFileSync(`${context.extensionPath}/media/words.json`, "utf8");
    const data = JSON.parse(rawdata);
    const words = data.words;
    const codes = data.codes;
    // Add status bar icon
    myStatusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left, 1);
    myStatusBarItem.command = "warmUp.start";
    myStatusBarItem.tooltip = "Start typing test";
    myStatusBarItem.text = `$(record-keys) Warm Up`;
    context.subscriptions.push(myStatusBarItem);
    // Display status bar icon
    myStatusBarItem.show();
    // Register start command
    context.subscriptions.push(vscode_1.commands.registerCommand("warmUp.start", () => {
        // Create or show webview
        webviewPanel_1.default.createOrShow(context.extensionUri);
        // Send all user settings to webview to start
        if (webviewPanel_1.default.currentPanel) {
            webviewPanel_1.default.currentPanel.sendStartAndConfig(words, codes);
        }
    }));
    // Register practiceWithSelection command
    context.subscriptions.push(vscode_1.commands.registerCommand("warmUp.practiceWithSelection", () => {
        // Return if no editor open
        const editor = vscode_1.window.activeTextEditor;
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
        const selectedCodeLanguage = editor.document.fileName.split(".").pop();
        // Create or show webview
        webviewPanel_1.default.createOrShow(context.extensionUri);
        console.log(selectedCodeLanguage);
        console.log(selectedCode);
        // Send all user settings to webview to start with selection
        if (webviewPanel_1.default.currentPanel) {
            webviewPanel_1.default.currentPanel.sendStartWithSelectionAndConfig(selectedCode, selectedCodeLanguage, words, codes);
        }
    }));
    // Register switchNaturalLanguage command
    context.subscriptions.push(vscode_1.commands.registerCommand("warmUp.switchNaturalLanguage", async function showQuickPick() {
        const userChoice = await vscode_1.window.showQuickPick([
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
        ], {
            placeHolder: "Choose a natural language to practice with.",
        });
        // Update the configuration value with user choice
        await vscode_1.workspace
            .getConfiguration()
            .update("warmUp.switchNaturalLanguage", userChoice, vscode_1.ConfigurationTarget.Global);
        // Send configuration change to webview if it exists
        if (webviewPanel_1.default.currentPanel) {
            webviewPanel_1.default.currentPanel.sendConfigMessage("switchNaturalLanguage", userChoice);
        }
    }));
    // Register switchProgrammingLanguage command
    context.subscriptions.push(vscode_1.commands.registerCommand("warmUp.switchProgrammingLanguage", async function showQuickPick() {
        const userChoice = await vscode_1.window.showQuickPick([
            "javascript",
            "python",
            "java",
            "csharp",
            "typescript",
            "cpp",
            "c",
            "go",
            "kotlin",
            "ruby",
            "rust",
        ], {
            placeHolder: "Choose a programming language to practice with.",
        });
        // Update the configuration value with user choice
        await vscode_1.workspace
            .getConfiguration()
            .update("warmUp.switchProgrammingLanguage", userChoice, vscode_1.ConfigurationTarget.Global);
        // Send configuration change to webview if it exists
        if (webviewPanel_1.default.currentPanel) {
            webviewPanel_1.default.currentPanel.sendConfigMessage("switchProgrammingLanguage", userChoice);
        }
    }));
    // Register switchTypingMode command
    context.subscriptions.push(vscode_1.commands.registerCommand("warmUp.switchTypingMode", async function showQuickPick() {
        // Get user choice
        let userChoice = await vscode_1.window.showQuickPick([
            "$(book) words (fixed amount)",
            "$(watch) words (against the clock)",
            "$(code) code snippets",
        ], {
            placeHolder: "Practice a fixed amount of words, against the clock or with code snippets.",
        });
        if (userChoice === "$(book) words (fixed amount)") {
            userChoice = "words (fixed amount)";
        }
        else if (userChoice === "$(watch) words (against the clock)") {
            userChoice = "words (against the clock)";
        }
        else if (userChoice === "$(code) code snippets") {
            userChoice = "code snippets";
        }
        // Update the configuration value with user choice
        await vscode_1.workspace
            .getConfiguration()
            .update("warmUp.switchTypingMode", userChoice, vscode_1.ConfigurationTarget.Global);
        // Send configuration change to webview if it exists
        if (webviewPanel_1.default.currentPanel) {
            webviewPanel_1.default.currentPanel.sendConfigMessage("switchTypingMode", userChoice);
        }
    }));
    // Register togglePunctuation command
    context.subscriptions.push(vscode_1.commands.registerCommand("warmUp.togglePunctuation", async function showQuickPick() {
        // Get user choice
        let userChoice = await vscode_1.window.showQuickPick(["$(circle-slash) false", "$(check) true"], {
            placeHolder: 'Enable or disable punctuation (doesn\'t affect "code snippets" mode).',
        });
        if (userChoice === "$(circle-slash) false") {
            userChoice = "false";
        }
        else if (userChoice === "$(check) true") {
            userChoice = "true";
        }
        // Update the configuration value with user choice
        await vscode_1.workspace
            .getConfiguration()
            .update("warmUp.togglePunctuation", userChoice, vscode_1.ConfigurationTarget.Global);
        // Send configuration change to webview if it exists
        if (webviewPanel_1.default.currentPanel) {
            webviewPanel_1.default.currentPanel.sendConfigMessage("togglePunctuation", userChoice);
        }
    }));
    // Register changeCount command
    context.subscriptions.push(vscode_1.commands.registerCommand("warmUp.changeCount", async function showQuickPick() {
        // Get user choice
        const userChoice = await vscode_1.window.showQuickPick(["15", "30", "60", "120", "240"], {
            placeHolder: 'Change the amount of words or the timer (doesn\'t affect "code snippets" mode).',
        });
        // Update the configuration value with user choice
        await vscode_1.workspace
            .getConfiguration()
            .update("warmUp.changeCount", userChoice, vscode_1.ConfigurationTarget.Global);
        // Send configuration change to webview if it exists
        if (webviewPanel_1.default.currentPanel) {
            webviewPanel_1.default.currentPanel.sendConfigMessage("changeCount", userChoice);
        }
    }));
    // Register toggleColorBlind command
    context.subscriptions.push(vscode_1.commands.registerCommand("warmUp.toggleColorBlindMode", async function showQuickPick() {
        // Get user choice
        let userChoice = await vscode_1.window.showQuickPick(["$(circle-slash) false", "$(check) true"], {
            placeHolder: 'Enable or disable color blind mode (doesn\'t affect "code snippets" mode).',
        });
        if (userChoice === "$(circle-slash) false") {
            userChoice = "false";
        }
        else if (userChoice === "$(check) true") {
            userChoice = "true";
        }
        // Update the configuration value with user choice
        await vscode_1.workspace
            .getConfiguration()
            .update("warmUp.toggleColorBlindMode", userChoice, vscode_1.ConfigurationTarget.Global);
        // Send configuration change to webview if it exists
        if (webviewPanel_1.default.currentPanel) {
            webviewPanel_1.default.currentPanel.sendConfigMessage("toggleColorBlindMode", userChoice);
        }
    }));
    // Register webview panel serializer
    if (vscode_1.window.registerWebviewPanelSerializer) {
        // Make sure we register a serializer in activation event
        vscode_1.window.registerWebviewPanelSerializer(webviewPanel_1.default.viewType, {
            async deserializeWebviewPanel(webviewPanel, state) {
                // Reset the webview options so we use latest uri for `localResourceRoots`.
                webviewPanel.webview.options = {
                    enableScripts: true,
                    localResourceRoots: [vscode_1.Uri.joinPath(context.extensionUri, "media")],
                };
                webviewPanel_1.default.revive(webviewPanel, context.extensionUri);
                // Send config
                if (webviewPanel_1.default.currentPanel) {
                    webviewPanel_1.default.currentPanel.sendStartAndConfig(words, codes);
                }
            },
        });
    }
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map