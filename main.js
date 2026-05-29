const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { execFile } = require("child_process");

let mainWindow;

function findVLC() {
  const vlcPaths = [
    "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe",
    "C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe",
    "D:\\Program Files\\VideoLAN\\VLC\\vlc.exe",
    "D:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe"
  ];

  for (const p of vlcPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return null;
}

function playInVLC(streamUrl) {
  const vlcPath = findVLC();

  if (!vlcPath) {
    dialog.showErrorBox(
      "VLC Not Found",
      "Please install VLC Media Player first."
    );
    return;
  }

  execFile(vlcPath, [streamUrl], (err) => {
    if (err) {
      dialog.showErrorBox(
        "Error",
        "Could not open VLC."
      );
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 260,
    resizable: false,
    autoHideMenuBar: true,
    title: "ASVM Player",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile("index.html");
}

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
}

app.whenReady().then(() => {

  app.setAsDefaultProtocolClient("asvm");

  createWindow();

  const protocolArg = process.argv.find(arg =>
    arg.startsWith("asvm://")
  );

  if (protocolArg) {
    try {
      const urlObj = new URL(protocolArg);
      const stream =
        urlObj.searchParams.get("url");

      if (stream) {
        playInVLC(stream);
      }

    } catch (e) {
      console.log(e);
    }
  }
});

app.on("second-instance", (event, argv) => {

  const protocolArg =
    argv.find(arg =>
      arg.startsWith("asvm://")
    );

  if (protocolArg) {
    try {

      const urlObj =
        new URL(protocolArg);

      const stream =
        urlObj.searchParams.get("url");

      if (stream) {
        playInVLC(stream);
      }

    } catch (e) {
      console.log(e);
    }
  }

  if (mainWindow) {
    mainWindow.focus();
  }
});

app.on("window-all-closed", () => {
  app.quit();
});