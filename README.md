# Warm Up

🔥👨‍💻 A VS Code extension to practice and improve your typing speed right inside your code editor.

## Install

1. Go to [VS Marketplace](https://marketplace.visualstudio.com/items?itemName=Jeusto.warm-up-typing-test)
2. Click on the "Install" button.

## Overview

![demo](https://raw.githubusercontent.com/Jeusto/vscode-typing-test/master/demo.gif?token=APQ6BVDI4QHTPKVR7TTHYOLBBSL26)

### Start

Open the extension panel either by clicking on the keyboard icon in the status bar or by hitting `ctrl + shift + p` and executing the `warmUp.start` command.

### Restart

To restart the typing test, press `esc` or click the restart button. If you hold shift while clicking the restart button, the typing test will restart with the same word list.

### Settings

You can configure the typing test by changing the settings through commands or in the user settings editor.

| Setting Name               | Description                                                             | Default Value |
| -------------------------- | ----------------------------------------------------------------------- | ------------- |
| `warmUp.switchLanguage`    | Choose a specific language to practice with.                            | `english`     |
| `warmUp.switchTypingMode`  | Practice a set number of words or against a timer.                      | `onFailure`   |
| `warmUp.togglePunctuation` | Activate/deactivate punctuation.                                        | `false`       |
| `warmUp.changeCount`       | Change the amount of words or the timer (depending on the typing mode). | `15`          |

## Contributing and Feedback

Feel free to give any feedback, report an issue or contribute. The main functionnality that I want to add right now is an option to practice typing code similar to what you can find on speedcoder website.

## Credits

- Typings: Original website forked to make this extension.
- Flaticon: Svgs used to make the extension icon.
