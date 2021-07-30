"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                  ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
exports.__esModule = true;
exports.activate = void 0;
// This script will be run within VS Code
// It can access the main VS Code APIs directly
var vscode_1 = require("vscode");
// Status bar item
var myStatusBarItem;
// Function called after activation event
function activate(context) {
  // Fetch words from json file
  var fs = require("fs");
  var rawdata = fs.readFileSync(
    context.extensionPath + "\\media\\words.json",
    "utf8"
  );
  var data = JSON.parse(rawdata);
  var words = data.words;
  // Add status bar icon
  myStatusBarItem = vscode_1.window.createStatusBarItem(
    vscode_1.StatusBarAlignment.Left,
    1
  );
  myStatusBarItem.command = "warmUp.start";
  context.subscriptions.push(myStatusBarItem);
  // Display status bar icon
  myStatusBarItem.text = "$(record-keys) Warm Up";
  myStatusBarItem.show();
  // Register start command
  context.subscriptions.push(
    vscode_1.commands.registerCommand("warmUp.start", function () {
      // Create or show webview
      WarmUpPanel.createOrShow(context.extensionUri);
      // Send all user settings with message
      WarmUpPanel.currentPanel.sendAllConfigMessage(words);
    })
  );
  // Register switch language command
  context.subscriptions.push(
    vscode_1.commands.registerCommand(
      "warmUp.switchLanguage",
      function showQuickPick() {
        return __awaiter(this, void 0, void 0, function () {
          var userChoice;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                return [
                  4 /*yield*/,
                  vscode_1.window.showQuickPick(
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
                      "javascriptTemp",
                    ],
                    {
                      placeHolder:
                        "Choose a specific language to practice with",
                    }
                  ),
                ];
              case 1:
                userChoice = _a.sent();
                // Update the configuration value with user choice
                return [
                  4 /*yield*/,
                  vscode_1.workspace
                    .getConfiguration()
                    .update(
                      "warmUp.switchLanguage",
                      userChoice,
                      vscode_1.ConfigurationTarget.Global
                    ),
                ];
              case 2:
                // Update the configuration value with user choice
                _a.sent();
                // Send message to webview if it exists
                if (WarmUpPanel.currentPanel) {
                  WarmUpPanel.currentPanel.sendConfigMessage(
                    "switchLanguage",
                    userChoice
                  );
                }
                return [2 /*return*/];
            }
          });
        });
      }
    )
  );
  // Register switch typing mode command
  context.subscriptions.push(
    vscode_1.commands.registerCommand(
      "warmUp.switchTypingMode",
      function showQuickPick() {
        return __awaiter(this, void 0, void 0, function () {
          var userChoice;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                return [
                  4 /*yield*/,
                  vscode_1.window.showQuickPick(["wordcount", "time"], {
                    placeHolder:
                      "Practice a set number of words or against a timer",
                  }),
                ];
              case 1:
                userChoice = _a.sent();
                // Update the configuration value with user choice
                return [
                  4 /*yield*/,
                  vscode_1.workspace
                    .getConfiguration()
                    .update(
                      "warmUp.switchTypingMode",
                      userChoice,
                      vscode_1.ConfigurationTarget.Global
                    ),
                ];
              case 2:
                // Update the configuration value with user choice
                _a.sent();
                // Send message to webview if it exists
                if (WarmUpPanel.currentPanel) {
                  WarmUpPanel.currentPanel.sendConfigMessage(
                    "switchTypingMode",
                    userChoice
                  );
                }
                return [2 /*return*/];
            }
          });
        });
      }
    )
  );
  // Register toggle punctuation command
  context.subscriptions.push(
    vscode_1.commands.registerCommand(
      "warmUp.togglePunctuation",
      function showQuickPick() {
        return __awaiter(this, void 0, void 0, function () {
          var userChoice;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                return [
                  4 /*yield*/,
                  vscode_1.window.showQuickPick(["false", "true"], {
                    placeHolder: "Activate/deactivate punctuation",
                  }),
                ];
              case 1:
                userChoice = _a.sent();
                // Update the configuration value with user choice
                return [
                  4 /*yield*/,
                  vscode_1.workspace
                    .getConfiguration()
                    .update(
                      "warmUp.togglePunctuation",
                      userChoice,
                      vscode_1.ConfigurationTarget.Global
                    ),
                ];
              case 2:
                // Update the configuration value with user choice
                _a.sent();
                // Send message to webview if it exists
                if (WarmUpPanel.currentPanel) {
                  WarmUpPanel.currentPanel.sendConfigMessage(
                    "togglePunctuation",
                    userChoice
                  );
                }
                return [2 /*return*/];
            }
          });
        });
      }
    )
  );
  // Register change word/time count
  context.subscriptions.push(
    vscode_1.commands.registerCommand(
      "warmUp.changeCount",
      function showQuickPick() {
        return __awaiter(this, void 0, void 0, function () {
          var userChoice;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                return [
                  4 /*yield*/,
                  vscode_1.window.showQuickPick(
                    ["15", "30", "60", "120", "240"],
                    {
                      placeHolder:
                        "Change the amount of words or the timer (depending on the typing mode)",
                    }
                  ),
                ];
              case 1:
                userChoice = _a.sent();
                // Update the configuration value with user choice
                return [
                  4 /*yield*/,
                  vscode_1.workspace
                    .getConfiguration()
                    .update(
                      "warmUp.changeCount",
                      userChoice,
                      vscode_1.ConfigurationTarget.Global
                    ),
                ];
              case 2:
                // Update the configuration value with user choice
                _a.sent();
                // Send message to webview if it exists
                if (WarmUpPanel.currentPanel) {
                  WarmUpPanel.currentPanel.sendConfigMessage(
                    "changeCount",
                    userChoice
                  );
                }
                return [2 /*return*/];
            }
          });
        });
      }
    )
  );
  // Register webview panel serializer
  if (vscode_1.window.registerWebviewPanelSerializer) {
    // Make sure we register a serializer in activation event
    vscode_1.window.registerWebviewPanelSerializer(WarmUpPanel.viewType, {
      deserializeWebviewPanel: function (webviewPanel, state) {
        return __awaiter(this, void 0, void 0, function () {
          return __generator(this, function (_a) {
            // Reset the webview options so we use latest uri for `localResourceRoots`.
            webviewPanel.webview.options = {
              enableScripts: true,
              localResourceRoots: [
                vscode_1.Uri.joinPath(context.extensionUri, "media"),
              ],
            };
            WarmUpPanel.revive(webviewPanel, context.extensionUri);
            return [2 /*return*/];
          });
        });
      },
    });
  }
}
exports.activate = activate;
// Manages webview panel
var WarmUpPanel = /** @class */ (function () {
  function WarmUpPanel(panel, extensionUri) {
    var _this = this;
    this._disposables = [];
    this._panel = panel;
    this._extensionUri = extensionUri;
    // Set the webview's initial html content
    this.update();
    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(
      function () {
        return _this.dispose();
      },
      null,
      this._disposables
    );
    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      function (message) {
        return __awaiter(_this, void 0, void 0, function () {
          var _a;
          return __generator(this, function (_b) {
            switch (_b.label) {
              case 0:
                _a = message.command;
                switch (_a) {
                  case "changeCount":
                    return [3 /*break*/, 1];
                }
                return [3 /*break*/, 3];
              case 1:
                // Update the configuration value with user choice
                return [
                  4 /*yield*/,
                  vscode_1.workspace
                    .getConfiguration()
                    .update(
                      "warmUp.changeCount",
                      message.count.toString(),
                      vscode_1.ConfigurationTarget.Global
                    ),
                ];
              case 2:
                // Update the configuration value with user choice
                _b.sent();
                _b.label = 3;
              case 3:
                return [2 /*return*/];
            }
          });
        });
      },
      null,
      this._disposables
    );
  }
  WarmUpPanel.createOrShow = function (extensionUri) {
    var column = vscode_1.window.activeTextEditor
      ? vscode_1.window.activeTextEditor.viewColumn
      : undefined;
    // If we already have a panel, show it.
    if (WarmUpPanel.currentPanel) {
      WarmUpPanel.currentPanel._panel.reveal(column);
      return;
    }
    // Otherwise, create a new panel.
    var panel = vscode_1.window.createWebviewPanel(
      WarmUpPanel.viewType,
      "Warm Up",
      column || vscode_1.ViewColumn.One,
      {
        // Enable javascript in the webview
        enableScripts: true,
        retainContextWhenHidden: true,
        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [vscode_1.Uri.joinPath(extensionUri, "media")],
      }
    );
    WarmUpPanel.currentPanel = new WarmUpPanel(panel, extensionUri);
  };
  WarmUpPanel.revive = function (panel, extensionUri) {
    WarmUpPanel.currentPanel = new WarmUpPanel(panel, extensionUri);
  };
  WarmUpPanel.prototype.sendAllConfigMessage = function (words) {
    this._panel.webview.postMessage({
      type: "allConfig",
      words: words,
      language: vscode_1.workspace
        .getConfiguration()
        .get("warmUp.switchLanguage"),
      mode: vscode_1.workspace
        .getConfiguration()
        .get("warmUp.switchTypingMode"),
      count: vscode_1.workspace.getConfiguration().get("warmUp.changeCount"),
      punctuation: vscode_1.workspace
        .getConfiguration()
        .get("warmUp.togglePunctuation"),
    });
  };
  WarmUpPanel.prototype.sendConfigMessage = function (config, value) {
    this._panel.webview.postMessage({
      type: "singleConfig",
      config: config,
      value: value,
    });
  };
  WarmUpPanel.prototype.dispose = function () {
    WarmUpPanel.currentPanel = undefined;
    // Clean up our resources
    this._panel.dispose();
    while (this._disposables.length) {
      var x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  };
  WarmUpPanel.prototype.update = function () {
    var webview = this._panel.webview;
    this._panel.webview.html = this.getHtmlForWebview(webview);
    this._panel.title = "Warm Up";
  };
  WarmUpPanel.prototype.getHtmlForWebview = function (webview) {
    // Uri we use to load this script in the webview
    var scriptUri = webview.asWebviewUri(
      vscode_1.Uri.joinPath(this._extensionUri, "media", "main.js")
    );
    // Uri to load styles into webview
    var styleVSCodeUri = webview.asWebviewUri(
      vscode_1.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );
    var stylesGameUri = webview.asWebviewUri(
      vscode_1.Uri.joinPath(this._extensionUri, "media", "game.css")
    );
    var stylesThemeUri = webview.asWebviewUri(
      vscode_1.Uri.joinPath(this._extensionUri, "media", "theme.css")
    );
    // Use a nonce to only allow specific scripts to be run
    var nonce = getNonce();
    return (
      '<!DOCTYPE html>\n\t\t\t<html lang="en">\n\t\t\t<head>\n\t\t\t\t<meta charset="UTF-8">\n\n\t\t\t\t<!--\n\t\t\t\t\tUse a content security policy to only allow loading images from https or from our extension directory,\n\t\t\t\t\tand only allow scripts that have a specific nonce.\n\t\t\t\t-->\n\t\t\t\t<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src ' +
      webview.cspSource +
      "; img-src " +
      webview.cspSource +
      " https:; script-src 'nonce-" +
      nonce +
      '\';">\n\n\t\t\t\t<meta name="viewport" content="width=device-width, initial-scale=1.0">\n\n\t\t\t\t<link href="' +
      styleVSCodeUri +
      '" rel="stylesheet">\n\t\t\t\t<link href="' +
      stylesGameUri +
      '" rel="stylesheet">\n\t\t\t\t<link href="' +
      stylesThemeUri +
      '" rel="stylesheet">\n\n\t\t\t\t<title>Warm Up</title>\n\t\t\t</head> \n      <body>\n        <div id="top">\n          <div id="logs"> </div>\n          <h2 id="header">\n            Warm Up - Practice typing\n          </h2>\n          <p>Hit "ctrl+shift+p" and enter "warmup" to see available commands</p>\n        </div>\n\n        <div id="command-center">\n          <div class="bar">\n            <div id="left-wing">\n              <span id="word-count">\n                <span id="wc-15">15</span>\n                <text> / </text>\n                <span id="wc-30">30</span>\n                <text> / </text>\n                <span id="wc-60">60</span>\n                <text> / </text>\n                <span id="wc-120">120</span>\n                <text> / </text>\n                <span id="wc-240">240</span>\n              </span>\n              <span id="time-count">\n                <span id="tc-15">15</span>\n                <text> / </text>\n                <span id="tc-30">30</span>\n                <text> / </text>\n                <span id="tc-60">60</span>\n                <text> / </text>\n                <span id="tc-120">120</span>\n                <text> / </text>\n                <span id="tc-240">240</span>\n              </span>\n            </div>\n            <div id="right-wing">WPM: XX / ACC: XX</div>\n          </div>\n          <div id="typing-area">\n            <div id="text-display"></div>\n            <div class="bar">\n              <input id="input-field" type="text" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" tabindex="1"/>\n              <button id="restart-button" tabindex="2">restart</button>\n            </div>\n          </div>\n        </div>\n        <h1 id="lines-of-code-counter"></h1>\n        <script nonce="' +
      nonce +
      '" src="' +
      scriptUri +
      '"></script>\n      </body>\n\t\t\t</html>'
    );
  };
  WarmUpPanel.prototype.panelExists = function () {
    return WarmUpPanel.currentPanel !== undefined;
  };
  WarmUpPanel.viewType = "warmUp";
  return WarmUpPanel;
})();
// Function to generate nonce
function getNonce() {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
