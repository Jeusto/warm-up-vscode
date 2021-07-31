"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
// Manages webview panel
class WarmUpPanel {
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
    static revive(panel, extensionUri) {
        WarmUpPanel.currentPanel = new WarmUpPanel(panel, extensionUri);
    }
    sendAllConfigMessage(words) {
        this._panel.webview.postMessage({
            type: "allConfig",
            words: words,
            language: vscode_1.workspace.getConfiguration().get("warmUp.switchLanguage"),
            mode: vscode_1.workspace.getConfiguration().get("warmUp.switchTypingMode"),
            count: vscode_1.workspace.getConfiguration().get("warmUp.changeCount"),
            punctuation: vscode_1.workspace.getConfiguration().get("warmUp.togglePunctuation"),
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
    update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this.getHtmlForWebview(webview);
        this._panel.title = "Warm Up";
    }
    getHtmlForWebview(webview) {
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
				<link href="${stylesThemeUri}" rel="stylesheet">

				<title>Warm Up</title>
			</head> 
      <body>
        <div id="top">
          <div id="logs"> </div>
          <h2 id="header">
            Warm Up - Typing test
          </h2>
          <p>Hit "ctrl+shift+p" and enter "warmup" to see available commands</p>
          <div id="mode-buttons">
             <svg id="wordsModeButton" class="icon-button" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round"   stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <svg id="codeModeButton" class="icon-button" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg id="codeModeButton" class="icon-button" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
           </svg>
          </div>
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
              <span id="language-selected">Javascript</span>
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
          <div id="coding-area" style="display: inline;">
            <div id="code-display" style="display: block; height: auto;">
              <span class="highlight">head </span>
              <span>other </span>
              <span>other </span>
              <span>other </span>
              <span>other </span>
              <span>other </span>
              <span>other </span>
              <span>other </span>
              <span>other </span>
            </div>
            <div class="bar">
              <input id="input-field" type="text" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" tabindex="1"/>
              <button id="restart-button" tabindex="2">restart</button>
            </div>            
          </div>
        </div>
        <h1 id="lines-of-code-counter"></h1>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
			</html>`;
    }
    panelExists() {
        return WarmUpPanel.currentPanel !== undefined;
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