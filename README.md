# Timey

Timey is a Chrome extension that lets you set a timer quickly and easily without fiddling with controls.

## Installation

1. Download and uncompress zip.
2. In Chrome, go to the extensions page at `chrome://extensions/`.
3. Enable Developer Mode.
4. Choose `Load Unpacked` and select the folder.

## Build

1. `npm install` to install the necessary dependencies.
2. Update `version` in `manifest.json`.
3. `npm run build`.

## Usage

Once installed, you can access the extension by clicking the icon in the Chrome toolbar.

- Enter a duration or scheduled time into the input eg. `@6:30`, `1 hour 30 minutes`, `2.5hours`, `01:30:00` etc.
- Press `Start timer` or press enter to start the timer.
- Once your timer is complete, a chime will play.