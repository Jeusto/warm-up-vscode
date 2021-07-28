"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
/* eslint-disable @typescript-eslint/no-var-requires */
const vscode_1 = require("vscode");
function activate(context) {
    // Fetch words from json file
    const fs = require("fs");
    const rawdata = fs.readFileSync(`${context.extensionPath}\\media\\words.json`, "utf8");
    const data = JSON.parse(rawdata);
    const languages = data.languages;
    const words = data.words;
    // Start command
    context.subscriptions.push(vscode_1.commands.registerCommand("warmUp.start", () => {
        // Create or show webview
        WarmUpPanel.createOrShow(context.extensionUri);
        // Send all user settings with message
        WarmUpPanel.currentPanel.sendAllConfigMessage();
    }));
    // Switch language command
    context.subscriptions.push(vscode_1.commands.registerCommand("warmUp.switchLanguage", async function showQuickPick() {
        // Get user choice
        let i = 0;
        const userChoice = await vscode_1.window.showQuickPick(["english", "french"], {
            placeHolder: "Choose a specific language to practice with",
            onDidSelectItem: (item) => vscode_1.window.showInformationMessage(`Focus ${++i}: ${item}`),
        });
        vscode_1.window.showInformationMessage(`Got: ${userChoice}`);
        // Send message to webview
        WarmUpPanel.currentPanel.sendConfigMessage("switchLanguage", userChoice);
        // Update the configuration value with user choice
        await vscode_1.workspace
            .getConfiguration()
            .update("warmup.switchLanguage", userChoice, vscode_1.ConfigurationTarget.Global);
    }));
    // Switch typing mode command
    context.subscriptions.push(vscode_1.commands.registerCommand("warmUp.switchTypingMode", async function showQuickPick() {
        // Get user choice
        const userChoice = await vscode_1.window.showQuickPick(["wordcount", "time"], {
            placeHolder: "Practice a set number of words or against a timer",
        });
        // Send message to webview
        WarmUpPanel.currentPanel.sendConfigMessage("switchTypingMode", userChoice);
        // Update the configuration value with user choice
        await vscode_1.workspace
            .getConfiguration()
            .update("warmup.switchTypingMode", userChoice, vscode_1.ConfigurationTarget.Global);
    }));
    // Toggle punctuation command
    context.subscriptions.push(vscode_1.commands.registerCommand("warmUp.togglePunctuation", async function showQuickPick() {
        // Get user choice
        const userChoice = await vscode_1.window.showQuickPick(["false", "true"], {
            placeHolder: "Activate/deactivate punctuation",
        });
        // Send message to webview
        WarmUpPanel.currentPanel.sendConfigMessage("togglePunctuation", userChoice);
        // Update the configuration value with user choice
        await vscode_1.workspace
            .getConfiguration()
            .update("warmup.togglePunctuation", userChoice, vscode_1.ConfigurationTarget.Global);
    }));
    if (vscode_1.window.registerWebviewPanelSerializer) {
        // Make sure we register a serializer in activation event
        vscode_1.window.registerWebviewPanelSerializer(WarmUpPanel.viewType, {
            async deserializeWebviewPanel(webviewPanel, state) {
                // Reset the webview options so we use latest uri for `localResourceRoots`.
                webviewPanel.webview.options = {
                    enableScripts: true,
                    localResourceRoots: [vscode_1.Uri.joinPath(context.extensionUri, "media")],
                };
                WarmUpPanel.revive(webviewPanel, context.extensionUri);
            },
        });
    }
}
exports.activate = activate;
// Manages webview panel
class WarmUpPanel {
    constructor(panel, extensionUri) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        // Set the webview's initial html content
        this._update();
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Update the content based on view changes
        this._panel.onDidChangeViewState((e) => {
            if (this._panel.visible) {
                this._update();
            }
        }, null, this._disposables);
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
                case "alert":
                    vscode_1.window.showErrorMessage(message.text);
                    return;
            }
        }, null, this._disposables);
    }
    static createOrShow(extensionUri) {
        const column = vscode_1.window.activeTextEditor
            ? vscode_1.window.activeTextEditor.viewColumn
            : undefined;
        // If we already have a panel, show it.
        if (WarmUpPanel.currentPanel) {
            WarmUpPanel.currentPanel._panel.reveal(column);
            return;
        }
        // Otherwise, create a new panel.
        const panel = vscode_1.window.createWebviewPanel(WarmUpPanel.viewType, "WarmUp", column || vscode_1.ViewColumn.One, {
            // Enable javascript in the webview
            enableScripts: true,
            // And restrict the webview to only loading content from our extension's `media` directory.
            localResourceRoots: [vscode_1.Uri.joinPath(extensionUri, "media")],
        });
        WarmUpPanel.currentPanel = new WarmUpPanel(panel, extensionUri);
    }
    static revive(panel, extensionUri) {
        WarmUpPanel.currentPanel = new WarmUpPanel(panel, extensionUri);
    }
    sendAllConfigMessage() {
        this._panel.webview.postMessage({
            type: "allConfig",
            language: vscode_1.workspace.getConfiguration().get("warmup.switchLanguage"),
            mode: vscode_1.workspace.getConfiguration().get("warmup.switchTypingMode"),
            count: vscode_1.workspace.getConfiguration().get("warmup.changeCount"),
            punctuation: vscode_1.workspace.getConfiguration().get("warmup.togglePunctuation"),
        });
    }
    sendConfigMessage(config, value) {
        this._panel.webview.postMessage({
            type: "singleConfig",
            config: config,
            value: value,
        });
    }
    dispose() {
        WarmUpPanel.currentPanel = undefined;
        // Clean up our resources
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
        this._panel.title = "WarmUp";
    }
    _getHtmlForWebview(webview) {
        // Uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(vscode_1.Uri.joinPath(this._extensionUri, "media", "main.js"));
        // Uri to load styles into webview
        const styleVSCodeUri = webview.asWebviewUri(vscode_1.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
        const stylesGameUri = webview.asWebviewUri(vscode_1.Uri.joinPath(this._extensionUri, "media", "game.css"));
        const stylesThemeUri = webview.asWebviewUri(vscode_1.Uri.joinPath(this._extensionUri, "media", "theme.css"));
        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${stylesGameUri}" rel="stylesheet">
				<link id="theme" href="${stylesThemeUri}" rel="stylesheet">

				<title>WarmUp</title>
			</head> 
      <body>
      ${vscode_1.workspace.getConfiguration().get("warmup.switchLanguage")}

        <h2 id="header">WarmUp</h2>
        <div id="command-center" class="">
          <div class="bar">
            <div id="left-wing">
              <span id="word-count">
                <span id="wc-15">15</span>
                <text> / </text>
                <span id="wc-30">30</span>
                <text> / </text>
                <span id="wc-60">60</span>
                <text> / </text>
                <span id="wc-120">120</span>
                <text> / </text
                <span id="wc-240">240</span>
              </span>
              <span id="time-count">
                <span id="tc-15">15</span>
                <text> / </text>
                <span id="tc-30">30</span>
                <text> / </text>
                <span id="tc-60">60</span>
                <text> / </text>
                <span id="tc-120">120</span>
                <text> / </text>
                <span id="tc-240">240</span>
              </span>
            </div>
            <div id="right-wing">WPM: XX / ACC: XX</div>
          </div>
          <div id="typing-area">
            <div id="text-display"></div>
            <div class="bar">
              <input id="input-field" type="text" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" tabindex="1"/>
              <button id="redo-button" tabindex="2">redo</button>
            </div>
          </div>
        </div>

        <h1 id="lines-of-code-counter">0</h1>

        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
			</html>`;
    }
}
WarmUpPanel.viewType = "warmUp";
function getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=extension.js.map