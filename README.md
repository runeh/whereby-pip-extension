# Whereby picture in picture extension

## Installing

It's not available in the chrome store. You can try it locally in developer
mode in chrome.

1. yarn && yarn build
2. open chrome://extensions/
3. check the "developer mode" button
4. click "load unpacked"
5. Select the `dist` folder in the checked out extension folder

The extension will show an icon next to the URL bar. It will be clickable when
a whereby conference is running. There are a few options that can be adjusted.
The options screen is available by right-clicking the extension icon.

## todo

- indicator for non-video users
- show names
- show indicators for non-video participants?
- clean up pipstate
- move running flag etc into pipstate
- show something when no videos
- when save, apply settings
- fix toggling
- recalculate displayables less often
- Rip out relevant part of of layout lib
- Remove config
