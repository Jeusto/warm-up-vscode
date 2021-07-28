"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const cats = {
    "Coding Cat": "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif",
    "Compiling Cat": "https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif",
    "Testing Cat": "https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif",
};
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand("warmUp.start", () => {
        WarmUpPanel.createOrShow(context.extensionUri);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("warmUp.switchLanguage", () => {
        if (WarmUpPanel.currentPanel) {
            //WarmUpPanel.currentPanel.doRefactor();
        }
    }));
    if (vscode.window.registerWebviewPanelSerializer) {
        // Make sure we register a serializer in activation event
        vscode.window.registerWebviewPanelSerializer(WarmUpPanel.viewType, {
            async deserializeWebviewPanel(webviewPanel, state) {
                // Reset the webview options so we use latest uri for `localResourceRoots`.
                webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
                WarmUpPanel.revive(webviewPanel, context.extensionUri);
            },
        });
    }
}
exports.activate = activate;
function getWebviewOptions(extensionUri) {
    return {
        // Enable javascript in the webview
        enableScripts: true,
        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
    };
}
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
                    vscode.window.showErrorMessage(message.text);
                    return;
            }
        }, null, this._disposables);
    }
    static createOrShow(extensionUri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // If we already have a panel, show it.
        if (WarmUpPanel.currentPanel) {
            WarmUpPanel.currentPanel._panel.reveal(column);
            return;
        }
        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(WarmUpPanel.viewType, "WarmUp", column || vscode.ViewColumn.One, getWebviewOptions(extensionUri));
        WarmUpPanel.currentPanel = new WarmUpPanel(panel, extensionUri);
    }
    static revive(panel, extensionUri) {
        WarmUpPanel.currentPanel = new WarmUpPanel(panel, extensionUri);
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
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "main.js"));
        // Uri to load styles into webview
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
        const stylesGameUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "game.css"));
        const stylesThemeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "theme.css"));
        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();
        // Fetch words from json file
        const wordsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "words.json"));
        const fs = require("fs");
        const rawdata = fs.readFileSync(wordsUri.fsPath, "utf8");
        const data = JSON.parse(rawdata);
        const languages = data.languages;
        const words = data.words;
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

				<title>Cat Coding</title>
			</head>
      <body>
        <h2 id="header">WarmUp</h2>
        <div id="command-center" class="">
          <div class="bar">
            <div id="left-wing">
              <span id="word-count">
                <span id="wc-10">10</span>
                <text> / </text>
                <span id="wc-25">25</span>
                <text> / </text>
                <span id="wc-50">50</span>
                <text> / </text>
                <span id="wc-100">100</span>
                <text> / </text>
                <span id="wc-250">250</span>
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