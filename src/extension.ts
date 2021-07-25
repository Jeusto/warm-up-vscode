import * as vscode from "vscode";

let myStatusBarItem: vscode.StatusBarItem;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate({ subscriptions }: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "warm-up-typing-test" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "warm-up-typing-test.warmUp",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage("Starting from command palette");
    }
  );

  subscriptions.push(disposable);

  // register a command that is invoked when the status bar
  // item is selected
  const myCommandId = "sample.showSelectionCount";
  subscriptions.push(
    vscode.commands.registerCommand(myCommandId, () => {
      vscode.window.showInformationMessage(`Starting from status bar`);
    })
  );

  // create a new status bar item that we can now manage
  myStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  myStatusBarItem.command = myCommandId;
  subscriptions.push(myStatusBarItem);

  // register some listener that make sure the status bar
  // item always up-to-date
  subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem)
  );
  subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection(updateStatusBarItem)
  );

  // update status bar item once at start
  updateStatusBarItem();
}

// this method is called when your extension is deactivated
export function deactivate() {}

function updateStatusBarItem(): void {
  myStatusBarItem.text = `$(list-selection) Warm up`;
  myStatusBarItem.show();
}
