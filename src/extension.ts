/* eslint-disable @typescript-eslint/no-var-requires */
// This script will be run within VS Code
// It can access the main VS Code APIs directly
import {
  Uri,
  Webview,
  Disposable,
  ViewColumn,
  WebviewPanel,
  StatusBarItem,
  ExtensionContext,
  ConfigurationTarget,
  StatusBarAlignment,
  window,
  commands,
  workspace,
} from "vscode";

let myStatusBarItem: StatusBarItem;

export function activate(context: ExtensionContext) {
  // Fetch words from json file
  const fs = require("fs");
  const rawdata = fs.readFileSync(
    `${context.extensionPath}\\media\\words.json`,
    "utf8"
  );
  const data = JSON.parse(rawdata);
  const words = data.words;

  // Add status bar icon
  myStatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 1);
  myStatusBarItem.command = "warmUp.start";
  context.subscriptions.push(myStatusBarItem);

  // Display status bar icon
  myStatusBarItem.text = `$(record-keys) Warm Up`;
  myStatusBarItem.show();

  // Start command
  context.subscriptions.push(
    commands.registerCommand("warmUp.start", () => {
      // Create or show webview
      WarmUpPanel.createOrShow(context.extensionUri);
      // Send all user settings with message
      WarmUpPanel.currentPanel.sendAllConfigMessage(words);
    })
  );

  // Switch language command
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
            "englishTop1000",
            "polish",
            "punjabi",
            "swedish",
            "french",
            "portuguese",
            "russian",
            "finnish",
          ],
          {
            placeHolder: "Choose a specific language to practice with",
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

  // Switch typing mode command
  context.subscriptions.push(
    commands.registerCommand(
      "warmUp.switchTypingMode",
      async function showQuickPick() {
        // Get user choice
        const userChoice = await window.showQuickPick(["wordcount", "time"], {
          placeHolder: "Practice a set number of words or against a timer",
        });

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

  // Toggle punctuation command
  context.subscriptions.push(
    commands.registerCommand(
      "warmUp.togglePunctuation",
      async function showQuickPick() {
        // Get user choice
        const userChoice = await window.showQuickPick(["false", "true"], {
          placeHolder: "Activate/deactivate punctuation",
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

  // Change word/time count
  context.subscriptions.push(
    commands.registerCommand(
      "warmUp.changeCount",
      async function showQuickPick() {
        // Get user choice
        const userChoice = await window.showQuickPick(
          ["15", "30", "60", "120", "240"],
          {
            placeHolder:
              "Change the amount of words or the timer (depending on the typing mode)",
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

// Manages webview panel
class WarmUpPanel {
  // Track the currently panel. Only allow a single panel to exist at a time.
  public static currentPanel: WarmUpPanel | undefined;

  public static readonly viewType = "warmUp";
  private readonly _panel: WebviewPanel;
  private readonly _extensionUri: Uri;
  private _disposables: Disposable[] = [];

  private constructor(panel: WebviewPanel, extensionUri: Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content
    this.update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "changeCount":
            // Update the configuration value with user choice
            await workspace
              .getConfiguration()
              .update(
                "warmUp.changeCount",
                message.count.toString(),
                ConfigurationTarget.Global
              );
        }
      },
      null,
      this._disposables
    );
  }

  public static createOrShow(extensionUri: Uri) {
    const column = window.activeTextEditor
      ? window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (WarmUpPanel.currentPanel) {
      WarmUpPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = window.createWebviewPanel(
      WarmUpPanel.viewType,
      "Warm Up",
      column || ViewColumn.One,
      {
        // Enable javascript in the webview
        enableScripts: true,
        retainContextWhenHidden: true,

        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [Uri.joinPath(extensionUri, "media")],
      }
    );

    WarmUpPanel.currentPanel = new WarmUpPanel(panel, extensionUri);
  }

  public static revive(panel: WebviewPanel, extensionUri: Uri) {
    WarmUpPanel.currentPanel = new WarmUpPanel(panel, extensionUri);
  }

  public sendAllConfigMessage(words) {
    this._panel.webview.postMessage({
      type: "allConfig",
      words: words,
      language: workspace.getConfiguration().get("warmUp.switchLanguage"),
      mode: workspace.getConfiguration().get("warmUp.switchTypingMode"),
      count: workspace.getConfiguration().get("warmUp.changeCount"),
      punctuation: workspace.getConfiguration().get("warmUp.togglePunctuation"),
    });
  }

  public sendConfigMessage(config: string, value: any) {
    this._panel.webview.postMessage({
      type: "singleConfig",
      config: config,
      value: value,
    });
  }

  public dispose() {
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

  private update() {
    const webview = this._panel.webview;
    this._panel.webview.html = this.getHtmlForWebview(webview);
    this._panel.title = "Warm Up";
  }

  private getHtmlForWebview(webview: Webview) {
    // Uri we use to load this script in the webview
    const scriptUri = webview.asWebviewUri(
      Uri.joinPath(this._extensionUri, "media", "main.js")
    );

    // Uri to load styles into webview
    const styleVSCodeUri = webview.asWebviewUri(
      Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );
    const stylesGameUri = webview.asWebviewUri(
      Uri.joinPath(this._extensionUri, "media", "game.css")
    );
    const stylesThemeUri = webview.asWebviewUri(
      Uri.joinPath(this._extensionUri, "media", "theme.css")
    );

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
            <svg id="icon" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
             <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd" />
            </svg>
            Warm Up - Practice typing
          </h2>
          <p>Hit "ctrl+shift+p" and enter "warmup" to see available commands</p>
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
        <h1 id="lines-of-code-counter"></h1>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
			</html>`;
  }

  public panelExists() {
    return WarmUpPanel.currentPanel !== undefined;
  }
}

// Function to generate nonce
function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
