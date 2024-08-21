# RateMyTarHeels

Firefox and Chrome browser extension that displays ratings of each professor on UNC Chapel Hill's ConnectCarolina while searching for courses.

Requires Firefox 121+ or a Chromium 121+ based browser.

## Developing
### Firefox
1. Visit the `about:debugging` webpage in your browser.
2. Click on "This Firefox"
3. Click on "Load Temporary Add-on..."
4. Select the `src` folder inside where you've cloned/download a copy of this repository to
### Chrome
### Brave
1. Visit `brave://extensions/` in your browser.
2. Click to enable the "developer mode" toggle in the top right hand corner.
3. Click on "Load unpacked" and select the `src` folder inside where you've cloned/download a copy of this repository to.
4. The extension's icon and version will show up. Make sure it is enabled to reload or disable/enable after making changes to apply them.

## Building from source
To package the extension from source for yourself:
1. Make sure you have Node.js installed on your system
2. `npm ci`
3. `node package-extension.js`