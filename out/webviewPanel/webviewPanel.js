"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
// Manages webview panel
class WarmUpPanel {
    // Constructor function
    constructor(panel, extensionUri) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        // Set the webview's initial html content
        this.update();
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case "changeCount":
                    // Update the configuration value with user choice
                    await vscode_1.workspace
                        .getConfiguration()
                        .update("warmUp.changeCount", message.count.toString(), vscode_1.ConfigurationTarget.Global);
            }
        }, null, this._disposables);
    }
    // Function to create or show existing webview panel
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
        const panel = vscode_1.window.createWebviewPanel(WarmUpPanel.viewType, "Warm Up", column || vscode_1.ViewColumn.One, {
            // Enable javascript in the webview
            enableScripts: true,
            retainContextWhenHidden: true,
            // And restrict the webview to only loading content from our extension's `media` directory.
            localResourceRoots: [vscode_1.Uri.joinPath(extensionUri, "media")],
        });
        WarmUpPanel.currentPanel = new WarmUpPanel(panel, extensionUri);
    }
    // Function to restore webview panel when VSCode is closed and opened back
    static revive(panel, extensionUri) {
        WarmUpPanel.currentPanel = new WarmUpPanel(panel, extensionUri);
    }
    // Function to send a message to the webview that contains all settings
    sendAllConfigMessage(words, codes) {
        this._panel.webview.postMessage({
            type: "allConfig",
            words: words,
            codes: codes,
            language: vscode_1.workspace
                .getConfiguration()
                .get("warmUp.switchNaturalLanguage"),
            codeLanguage: vscode_1.workspace
                .getConfiguration()
                .get("warmUp.switchProgrammingLanguage"),
            mode: vscode_1.workspace.getConfiguration().get("warmUp.switchTypingMode"),
            count: vscode_1.workspace.getConfiguration().get("warmUp.changeCount"),
            punctuation: vscode_1.workspace.getConfiguration().get("warmUp.togglePunctuation"),
            colorBlindMode: vscode_1.workspace
                .getConfiguration()
                .get("warmUp.toggleColorBlindMode"),
        });
    }
    // Function to send a message to the webview that contains one setting
    sendConfigMessage(config, value) {
        this._panel.webview.postMessage({
            type: "singleConfig",
            config: config,
            value: value,
        });
    }
    // Function to dispose of the webview panel
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
    // Function to update the webview's html content and title
    update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this.getHtmlForWebview(webview);
        this._panel.title = "Warm Up";
        this._panel.iconPath = vscode_1.Uri.joinPath(this._extensionUri, "media", "icon.svg");
    }
    // Function that returns the html for the webview
    getHtmlForWebview(webview) {
        // Uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(vscode_1.Uri.joinPath(this._extensionUri, "media", "main.js"));
        // Uri to load styles into webview
        const styleVSCodeUri = webview.asWebviewUri(vscode_1.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
        const styleGameUri = webview.asWebviewUri(vscode_1.Uri.joinPath(this._extensionUri, "media", "game.css"));
        const stylePrismUri = webview.asWebviewUri(vscode_1.Uri.joinPath(this._extensionUri, "media", "prism.css"));
        const styleColorBlindUri = webview.asWebviewUri(vscode_1.Uri.joinPath(this._extensionUri, "media", "colorblind.css"));
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
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} https:; img-src ${webview.cspSource} https:; script-src ${webview.cspSource} https:;">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

        <script
          src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/2.3.0/purify.min.js"
          integrity="sha512-FJzrdtFBVzaaehq9mzbhljqwJ7+jE0GyTa8UBxZdMsMUjflR25f5lJSGD0lmQPHnhQfnctG0B1TNQsObwyJUzA=="
          crossorigin="anonymous"
          referrerpolicy="no-referrer"
        ></script>
        <script
          src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/prism.min.js"
          integrity="sha512-axJX7DJduStuBB8ePC8ryGzacZPr3rdLaIDZitiEgWWk2gsXxEFlm4UW0iNzj2h3wp5mOylgHAzBzM4nRSvTZA=="
          crossorigin="anonymous"
          referrerpolicy="no-referrer"
        ></script>
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleGameUri}" rel="stylesheet">
				<link href="${stylePrismUri}" rel="stylesheet">
				<link href="${styleColorBlindUri}" rel="stylesheet">

				<title>Warm Up</title>
			</head> 
      <body>
        <div id="top">
          <h2 id="header">
            Warm Up - Typing test
          </h2>
          <p id="subtitle">Hit "ctrl+shift+p" and enter "warmup" to see available commands</p>
        </div>

        <div id="command-center">
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
                <text> / </text>
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
              <span id="language-selected">Language</span>
            </div>
            <div id="right-wing">WPM: XX / ACC: XX</div>
          </div>
          <div id="typing-area">
            <div id="text-display"></div>
            <div class="bar">
              <input id="input-field" type="text" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" tabindex="1"/>
              <button id="restart-button" tabindex="2">restart</button>
            </div>
          </div>
          <div id="coding-area" tabindex="-1" style="display: inline;">
            <div class="code-display">
              <div class="code">
                <pre id="code-pre"></pre>
                <span id="cursor" style="left: 0px; top: 0px" class="cursor"></span>
              </div>
            </div>
            <button id="restart-button" class=" codeButton" tabindex="2">restart</button>
          </div>
        </div>
        <div id="charDimensions"></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
			</html>`;
    }
}
exports.default = WarmUpPanel;
WarmUpPanel.viewType = "warmUp";
// Function to generate nonce
function getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=webviewPanel.js.map