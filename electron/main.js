const path = require("path");
const net = require("net");
const { app, BrowserWindow, shell, dialog } = require("electron");
const { createAppServer } = require("../server");

const DEFAULT_SERVER_PORT = Number(process.env.PORT || 3190);

let mainWindow = null;
let embeddedServer = null;
let serverUrl = "";

function checkPortOpen(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.setTimeout(1_000);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

async function ensureServerRunning() {
  let port = DEFAULT_SERVER_PORT;
  while (await checkPortOpen(port)) {
    port += 1;
  }

  embeddedServer = createAppServer({ port });
  await embeddedServer.start();
  serverUrl = `http://127.0.0.1:${port}/`;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1520,
    height: 980,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: "#08111b",
    autoHideMenuBar: true,
    title: "Market Intelligence Desk",
    show: false,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url).catch(() => {});
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(serverUrl)) {
      event.preventDefault();
      shell.openExternal(url).catch(() => {});
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.session.clearCache().finally(() => {
    mainWindow.loadURL(`${serverUrl}?v=${Date.now()}`);
  });
}

async function launchApp() {
  try {
    await ensureServerRunning();
    createMainWindow();
  } catch (error) {
    dialog.showErrorBox(
      "Market Intelligence Desk",
      error instanceof Error ? error.message : String(error)
    );
    app.quit();
  }
}

async function shutdownEmbeddedServer() {
  if (!embeddedServer) {
    return;
  }

  await embeddedServer.stop();
  embeddedServer = null;
}

app.setAppUserModelId("com.boiki.marketintelligencedesk");

app.whenReady().then(launchApp);

app.on("window-all-closed", () => {
  shutdownEmbeddedServer().catch(() => {});
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  shutdownEmbeddedServer().catch(() => {});
});

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await launchApp();
  }
});
