import path from "path";
import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage } from "electron";
import Store from "electron-store";

import { BridgeWsServer } from "../ws/server";
import { NfcBridge } from "../nfc/bridge";
import { config, setBridgeToken } from "../config";

type Settings = {
  deviceToken: string;
  autoStart: boolean;
};

const store = new Store<Settings>({
  name: "settings",
  defaults: {
    deviceToken: "",
    autoStart: false,
  },
});

let mainWindow: BrowserWindow | null = null;
let nfcBridge: NfcBridge | null = null;
let tray: Tray | null = null;
let lastErrorAt: number | null = null;

const wsServer = new BridgeWsServer({
  host: config.serviceHost,
  port: config.servicePort,
  getReaders: () => nfcBridge?.getReaders() ?? [],
  onLinkRequested: () => undefined,
  onLinkStopped: () => undefined,
});

const startBridge = () => {
  if (nfcBridge) return;
  nfcBridge = new NfcBridge(wsServer, () => {
    lastErrorAt = Date.now();
  });
  nfcBridge.start();
  console.log(
    `[NFC] Bridge running at ws://${config.serviceHost}:${config.servicePort}`,
  );
};

const createWindow = (showOnReady = true) => {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 520,
    resizable: false,
    show: false,
    title: "Rhinopass NFC Bridge",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const rendererPath = path.join(__dirname, "renderer", "index.html");
  mainWindow.loadFile(rendererPath);

  mainWindow.once("ready-to-show", () => {
    if (showOnReady) {
      mainWindow?.show();
    }
  });

  mainWindow.on("close", (event) => {
    if ((app as { isQuiting?: boolean }).isQuiting) return;
    event.preventDefault();
    mainWindow?.hide();
  });
};

const broadcastStatus = () => {
  if (!mainWindow) return;
  const readers = nfcBridge?.getReaders() ?? [];
  const hasReader = readers.length > 0;
  const isError =
    typeof lastErrorAt === "number" && Date.now() - lastErrorAt < 6000;
  const status = isError ? "error" : hasReader ? "online" : "connecting";
  updateTrayStatus(status);
  const payload = {
    readers,
    host: config.serviceHost,
    port: config.servicePort,
    writeEnabled: config.writeEnabled,
    tokenConfigured: Boolean(config.bridgeToken),
    status,
  };
  mainWindow.webContents.send("bridge:status", payload);
};

const applyAutoStart = (enabled: boolean) => {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: true,
  });
};

app.whenReady().then(() => {
  const savedToken = store.get("deviceToken");
  if (savedToken) {
    setBridgeToken(savedToken);
  }
  applyAutoStart(Boolean(store.get("autoStart")));

  const loginSettings = app.getLoginItemSettings();
  const shouldShow = !loginSettings.wasOpenedAtLogin;
  createWindow(shouldShow);
  startBridge();
  setupTray();

  setInterval(broadcastStatus, 1500);
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow(true);
    return;
  }
  mainWindow?.show();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (mainWindow) {
      mainWindow.hide();
      return;
    }
    app.quit();
  }
});

ipcMain.handle("bridge:get-status", () => ({
  readers: nfcBridge?.getReaders() ?? [],
  host: config.serviceHost,
  port: config.servicePort,
  writeEnabled: config.writeEnabled,
  tokenConfigured: Boolean(config.bridgeToken),
}));

ipcMain.handle("settings:get", () => ({
  deviceToken: store.get("deviceToken"),
  autoStart: Boolean(store.get("autoStart")),
}));

ipcMain.handle(
  "settings:set",
  async (_event, update: Partial<Settings>) => {
    if (typeof update.deviceToken === "string") {
      store.set("deviceToken", update.deviceToken.trim());
      setBridgeToken(update.deviceToken.trim());
    }
    if (typeof update.autoStart === "boolean") {
      store.set("autoStart", update.autoStart);
      applyAutoStart(update.autoStart);
    }
    return {
      deviceToken: store.get("deviceToken"),
      autoStart: Boolean(store.get("autoStart")),
    };
  },
);

function setupTray() {
  if (tray) return;
  tray = new Tray(getTrayIcon("connecting"));
  tray.setToolTip("Rhinopass NFC Bridge");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open",
      click: () => {
        if (!mainWindow) createWindow(true);
        mainWindow?.show();
      },
    },
    {
      label: "Quit",
      click: () => {
        (app as { isQuiting?: boolean }).isQuiting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => {
    if (!mainWindow) createWindow(true);
    mainWindow?.show();
  });
}

function getTrayIcon(status: "online" | "connecting" | "error") {
  const iconName =
    status === "online"
      ? "tray-online.svg"
      : status === "error"
        ? "tray-error.svg"
        : "tray-connecting.svg";
  const iconPath = path.join(__dirname, "renderer", iconName);
  return nativeImage.createFromPath(iconPath);
}

function updateTrayStatus(status: "online" | "connecting" | "error") {
  if (!tray) return;
  const icon = getTrayIcon(status);
  tray.setImage(icon);
}
