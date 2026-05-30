const {
  app,
  BrowserWindow,
  dialog
} = require("electron");

const path = require("path");
const fs = require("fs");
const { execFile } = require("child_process");

let mainWindow = null;

// ----------------------
// VLC PATH DETECTION
// ----------------------

function findVLC() {

  const vlcPaths = [

    "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe",

    "C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe",

    "D:\\Program Files\\VideoLAN\\VLC\\vlc.exe",

    "D:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe",

    "E:\\Program Files\\VideoLAN\\VLC\\vlc.exe",

    "E:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe"
  ];

  for (const vlcPath of vlcPaths) {

    if (fs.existsSync(vlcPath)) {
      return vlcPath;
    }
  }

  return null;
}

// ----------------------
// PLAY STREAM IN VLC
// ----------------------

function playInVLC(streamUrl) {

  const vlcPath = findVLC();

  if (!vlcPath) {

    dialog.showErrorBox(
      "VLC Not Found",
      "VLC Media Player is not installed.\n\nPlease install VLC first."
    );

    return;
  }

  execFile(vlcPath, [streamUrl], (error) => {

    if (error) {

      dialog.showErrorBox(
        "Playback Error",
        "Could not open stream in VLC."
      );
    }
  });
}

// ----------------------
// HANDLE CUSTOM URL
// ----------------------

function handleProtocolUrl(protocolUrl) {

  try {

    const url = new URL(protocolUrl);

    const stream =
      url.searchParams.get("url");

    if (stream) {

      playInVLC(stream);
    }

  } catch (error) {

    dialog.showErrorBox(
      "Protocol Error",
      "Invalid stream URL."
    );
  }
}

// ----------------------
// WINDOW
// ----------------------

function createWindow() {

  mainWindow = new BrowserWindow({

    width: 480,
    height: 340,

    minWidth: 480,
    minHeight: 340,

    autoHideMenuBar: true,

    title: "ASVM Player",

    backgroundColor: "#ffffff",

    webPreferences: {

      preload:
        path.join(
          __dirname,
          "preload.js"
        ),

      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile("index.html");
}

// ----------------------
// SINGLE INSTANCE
// ----------------------

const gotLock =
  app.requestSingleInstanceLock();

if (!gotLock) {

  app.quit();

} else {

  app.on(
    "second-instance",
    (event, argv) => {

      const protocolArg =
        argv.find(arg =>
          arg.startsWith(
            "asvm://"
          )
        );

      if (protocolArg) {

        handleProtocolUrl(
          protocolArg
        );
      }

      if (mainWindow) {

        if (
          mainWindow.isMinimized()
        ) {
          mainWindow.restore();
        }

        mainWindow.focus();
      }
    }
  );
}

// ----------------------
// APP READY
// ----------------------

app.whenReady().then(() => {

  createWindow();

  // Protocol Register Fix

  if (process.defaultApp) {

    app.setAsDefaultProtocolClient(
      "asvm",
      process.execPath,
      [
        path.resolve(
          process.argv[1]
        )
      ]
    );

  } else {

    app.setAsDefaultProtocolClient(
      "asvm"
    );
  }

  // Open from browser

  const protocolArg =
    process.argv.find(arg =>
      arg.startsWith(
        "asvm://"
      )
    );

  if (protocolArg) {

    handleProtocolUrl(
      protocolArg
    );
  }
});

// ----------------------
// APP EVENTS
// ----------------------

app.on(
  "window-all-closed",
  () => {

    if (
      process.platform !==
      "darwin"
    ) {

      app.quit();
    }
  }
);

app.on(
  "activate",
  () => {

    if (
      BrowserWindow
        .getAllWindows()
        .length === 0
    ) {

      createWindow();
    }
  }
);
