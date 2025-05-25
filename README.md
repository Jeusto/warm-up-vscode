# Warm Up

[![Version](https://img.shields.io/visual-studio-marketplace/v/jeusto.warm-up-typing-test.svg)](https://marketplace.visualstudio.com/items?itemName=Jeusto.warm-up-typing-test) [![Downloads](https://img.shields.io/vscode-marketplace/d/jeusto.warm-up-typing-test.svg)](https://marketplace.visualstudio.com/items?itemName=Jeusto.warm-up-typing-test) [![Rating](https://img.shields.io/visual-studio-marketplace/stars/jeusto.warm-up-typing-test.svg)](https://marketplace.visualstudio.com/items?itemName=Jeusto.warm-up-typing-test)

🔥👨‍💻 A VS Code extension to practice and improve your typing speed right inside your code editor. Practice with simple words or code snippets.

Choose between 12 natural languages, 12 programming languages or select anything in your editor and practice with your own code snippets.

## Install

1. Go to [VS Marketplace](https://marketplace.visualstudio.com/items?itemName=Jeusto.warm-up-typing-test)
2. Click on the "Install" button.

## Overview

![demo](https://raw.githubusercontent.com/Jeusto/warm-up-vscode/refs/heads/master/demo.gif)

### Start

Open the extension panel by clicking on the keyboard icon in the status bar, by entering the `ctrl + alt + p` shortcut or by hitting `ctrl + shift + p` and executing the `warmUp.start` command.

To practice with your own code snippets (or text), select anything in your editor and enter the `ctrl + alt + s` which will execute the command `warmUp.practiceWithSelection`

### Restart

To restart the typing test, press `esc` or click the restart button. If you hold shift while clicking the restart button, the typing test will restart with the same words list/code snippet.

### Settings

You can configure the typing test by changing the settings through commands or in the user settings editor.

| Setting Name                       | Description                                                                | Default Value          |
| ---------------------------------- | -------------------------------------------------------------------------- | ---------------------- |
| `warmUp.switchNaturalLanguage`     | Choose a natural language to practice with.                                | `english`              |
| `warmUp.switchProgrammingLanguage` | Choose a programming language to practice with.                            | `javascript`           |
| `warmUp.changeTypingMode`          | Practice a fixed amount of words, against the clock or with code snippets. | `words (fixed amount)` |
| `warmUp.changeCount`               | Change the amount of words or the timer (depending on the typing mode).    | `15`                   |
| `warmUp.togglePunctuation`         | Enable or disable punctuation (doesn't affect \"code snippets\" mode).     | `false`                |
| `warmUp.toggleColorBlindMode`      | Enable or disable color bind mode (doesn't concern "code snippets" mode).  | `false`                |

## Contributing and Feedback

Feel free to open issues or pull requests! Any feedback and contribution is highly appreciated. You can improve the existing code, add functionality, languages, code snippets etc.
Contact me on <a href="https://twitter.com/jeustoo">twitter</a> if you have any questions.

## Credits

- Typings: Original website forked to make this extension.
- Flaticon: Svgs used to make the extension icon.
