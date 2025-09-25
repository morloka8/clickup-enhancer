## ClickUp: Custom Shortcuts (Tampermonkey)

A Tampermonkey userscript that adds Hyperkey shortcuts (Ctrl+Cmd+Alt+Shift) to ClickUp. It streamlines common actions like completing tasks, setting due dates, managing tags, moving tasks, assigning, toggling layout (sidebar/fullscreen), and quick ratings.

### Why this exists
- Speeds up frequent actions with consistent keyboard shortcuts.
- Minimizes UI friction by hiding non-essential elements in the inbox empty state.
- Works with ClickUp's single-page app (SPA) navigation.

## Features
- **Hyperkey shortcuts**: Hold Ctrl+Cmd+Alt+Shift and press the key below.
- **Inbox polish**: Hides specific empty-state text on `/inbox` only.
- **SPA aware**: Re-applies styles on ClickUp route changes.
- **No extra permissions**: `@grant none`, runs only on `https://app.clickup.com/*`.

## Shortcuts
- **F**: Toggle task layout Sidebar ⇄ Fullscreen
- **E**: Complete
- **D**: Due Today
- **T**: Tags
- **M**: Move (opens Task settings, then Move)
- **A**: Assignee (works in task view and comment editor)
- **P**: Planning status (custom field)
- **1/2/3**: Rating (custom field)
- **0**: Clear rating
- **Backspace**: Delete task (with confirmation)
- **Enter**: Open the first task row in lists

Notes:
- Shortcuts are based on `KeyboardEvent.code` and ClickUp selectors. If the UI changes, see Troubleshooting.
- “Hyperkey” is a popular mapping where Caps Lock = Ctrl+Cmd+Alt+Shift, but any way to hold those 4 modifiers works.

## Requirements
- A modern browser with Tampermonkey installed (Chrome, Edge, Firefox, Safari).
- Optional: A Hyperkey setup
  - macOS: Karabiner-Elements, BetterTouchTool, or similar
  - Windows/Linux: any tool that can press Ctrl+Alt+Shift+Meta together

## Installation
### Install from GitHub (recommended)
1. Push `clickup-enhancer.user.js` to a public GitHub repo.
2. Open the RAW URL in your browser (replace `<your-username>`):
   - `https://raw.githubusercontent.com/<your-username>/clickup-enhancer/main/clickup-enhancer.user.js`
3. Tampermonkey will prompt to install. Confirm.

### Manual install (copy & paste)
1. Tampermonkey dashboard → Create a new script
2. Paste the contents of `clickup-enhancer.user.js`
3. Save

## Auto-updates (optional but recommended)
To enable automatic updates directly from GitHub, add these lines to the userscript header:
```js
// @downloadURL  https://raw.githubusercontent.com/<your-username>/clickup-enhancer/main/clickup-enhancer.user.js
// @updateURL    https://raw.githubusercontent.com/<your-username>/clickup-enhancer/main/clickup-enhancer.user.js
```
Also increment `@version` when you change behavior so Tampermonkey detects updates reliably.

## How it works
- Injects minimal CSS only on `/inbox` to hide specific empty-state text.
- Uses `MutationObserver` and a small URL polling to detect SPA route changes and re-apply CSS if needed.
- Provides utility helpers:
  - `waitFor(selector)`: waits for UI to appear
  - `openLayoutSwitcher(cb)`: opens layout dropdown, then runs `cb`
  - `toggleSidebarFullscreen()`: switches between sidebar and fullscreen, then sends `Escape` to close dropdowns
- All actions are executed via DOM queries and simulated clicks; no network calls or storage.

## Troubleshooting
- **Shortcut doesn’t trigger**
  - Ensure you are holding Ctrl+Cmd+Alt+Shift (the full hyperkey) before pressing the letter.
  - Verify the tab is focused (click inside the page once).
  - Check if another extension or site shortcut is intercepting the key.
- **Buttons/selectors not found**
  - ClickUp UI may have changed. Open DevTools → Console to see warnings (the script logs missing selectors).
  - Update selectors in the script where needed (search for `data-test` attributes used in queries).
  - If UI is slow to render, consider increasing the timeout in `waitFor()`.
- **Delete confirmation not found**
  - As a fallback, the script tries to find buttons containing “delete”/“löschen”. Update this logic if your UI language differs.
- **Conflicts**
  - Disable other keyboard/automation extensions to test.

## Development
- Main file: `clickup-enhancer.user.js`
- Bump the `@version` header on every user-visible change.
- Keep selectors narrow and prefer `data-test` attributes when present.
- Test both task view and list view.
- Consider adding a `CHANGELOG.md` once you publish releases.

## Privacy & permissions
- Runs only on `https://app.clickup.com/*` (`@match`).
- Does not request additional permissions (`@grant none`).
- Does not collect, transmit, or store any personal data.

## License
- MIT. See `LICENSE` for details.

## Credits
- Script by Davin. Inspired by common “Hyperkey” workflows to speed up task management in ClickUp.
