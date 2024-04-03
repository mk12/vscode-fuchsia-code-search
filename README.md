# VS Code: Fuchsia Code Search

This extension adds commands to open Fuchsia source files in [Code Search](https://cs.opensource.google).

## Install

Get [Fuchsia Code Search](https://marketplace.visualstudio.com/items?itemName=mk12.fuchsia-code-search) on the Visual Studio Marketplace.

## Features

- Opens Fuchsia Code Search for the current file, or copies the URL.
- If you have a selection, it will include that in the URL.
- To link to a single line, select it with Cmd/Ctrl+L first.

## Commands

- **Fuchsia Code Search: Copy URL**
- **Fuchsia Code Search: Open URL**

## FAQ

### What is the commit hash in the URL?

The URL links to a specific commit instead of `main` so that it stays stable over time. It can't generally use your current commit, since you might be on a feature branch that isn't in Code Search. Instead, it uses `git merge-base origin/main HEAD`. Note that if the file has local changes, the line number could be off.

## License

© 2024 Mitchell Kember

VS Code Fuchsia Code Search is available under the MIT License; see [LICENSE](LICENSE.md) for details.

