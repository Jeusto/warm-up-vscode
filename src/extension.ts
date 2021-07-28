/* eslint-disable @typescript-eslint/no-var-requires */
import {
  commands,
  window,
  ExtensionContext,
  Uri,
  Webview,
  WebviewPanel,
  Disposable,
  ViewColumn,
  ConfigurationTarget,
  workspace,
  WorkspaceEdit,
} from "vscode";

export function activate(context: ExtensionContext) {
  // Fetch words from json file
  const fs = require("fs");
  const rawdata = fs.readFileSync(
    `${context.extensionPath}\\media\\words.json`,
    "utf8"
  );
  const data = JSON.parse(rawdata);
  const languages = data.languages;
  const words = data.words;

  // Start command
  context.subscriptions.push(
    commands.registerCommand("warmUp.start", () => {
      // Create or show webview
      WarmUpPanel.createOrShow(context.extensionUri);
      // Send all user settings with message
      WarmUpPanel.currentPanel.sendAllConfigMessage();
    })
  );

  // Switch language command
  context.subscriptions.push(
    commands.registerCommand(
      "warmUp.switchLanguage",
      async function showQuickPick() {
        // Get user choice
        let i = 0;
        const userChoice = await window.showQuickPick(["english", "french"], {
          placeHolder: "Choose a specific language to practice with",
          onDidSelectItem: (item) =>
            window.showInformationMessage(`Focus ${++i}: ${item}`),
        });
        window.showInformationMessage(`Got: ${userChoice}`);

        // Send message to webview
        WarmUpPanel.currentPanel.sendConfigMessage(
          "switchLanguage",
          userChoice
        );

        // Update the configuration value with user choice
        await workspace
          .getConfiguration()
          .update(
            "warmup.switchLanguage",
            userChoice,
            ConfigurationTarget.Global
          );
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

        // Send message to webview
        WarmUpPanel.currentPanel.sendConfigMessage(
          "switchTypingMode",
          userChoice
        );

        // Update the configuration value with user choice
        await workspace
          .getConfiguration()
          .update(
            "warmup.switchTypingMode",
            userChoice,
            ConfigurationTarget.Global
          );
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

        // Send message to webview
        WarmUpPanel.currentPanel.sendConfigMessage(
          "togglePunctuation",
          userChoice
        );

        // Update the configuration value with user choice
        await workspace
          .getConfiguration()
          .update(
            "warmup.togglePunctuation",
            userChoice,
            ConfigurationTarget.Global
          );
      }
    )
  );

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
      "WarmUp",
      column || ViewColumn.One,
      {
        // Enable javascript in the webview
        enableScripts: true,

        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [Uri.joinPath(extensionUri, "media")],
      }
    );

    WarmUpPanel.currentPanel = new WarmUpPanel(panel, extensionUri);
  }

  public static revive(panel: WebviewPanel, extensionUri: Uri) {
    WarmUpPanel.currentPanel = new WarmUpPanel(panel, extensionUri);
  }

  public sendAllConfigMessage() {
    this._panel.webview.postMessage({
      type: "allConfig",
      language: workspace.getConfiguration().get("warmup.switchLanguage"),
      mode: workspace.getConfiguration().get("warmup.switchTypingMode"),
      count: workspace.getConfiguration().get("warmup.changeCount"),
      punctuation: workspace.getConfiguration().get("warmup.togglePunctuation"),
    });
  }

  public sendConfigMessage(config: string, value: any) {
    this._panel.webview.postMessage({
      type: "singleConfig",
      config: config,
      value: value,
    });
  }

  private constructor(panel: WebviewPanel, extensionUri: Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      (e) => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "alert":
            window.showErrorMessage(message.text);
            return;
        }
      },
      null,
      this._disposables
    );
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

  private _update() {
    const webview = this._panel.webview;
    this._panel.webview.html = this._getHtmlForWebview(webview);
    this._panel.title = "WarmUp";
  }

  private _getHtmlForWebview(webview: Webview) {
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
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${
          webview.cspSource
        }; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${stylesGameUri}" rel="stylesheet">
				<link id="theme" href="${stylesThemeUri}" rel="stylesheet">

				<title>WarmUp</title>
			</head> 
      <body>
      ${workspace.getConfiguration().get("warmup.switchLanguage")}

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

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
