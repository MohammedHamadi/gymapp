import { app, BrowserWindow, ipcMain, Menu } from "electron"; 
import path from "path";
import { fileURLToPath } from "url";
import db from "./db/client.js";
import pkg from 'node-machine-id';
const { machineIdSync } = pkg;
import { setupMemberHandlers } from "./handlers/memberHandlers.js";
import { setupPlanHandlers } from "./handlers/planHandlers.js";
import { setupSubscriptionHandlers } from "./handlers/subscriptionHandlers.js";
import { setupAccessLogHandlers } from "./handlers/accessLogHandlers.js";
import { setupTransactionHandlers } from "./handlers/transactionHandlers.js";
import { setupProductHandlers } from "./handlers/productHandlers.js";
import { setupSalesHistoryHandlers } from "./handlers/salesHistoryHandlers.js";
import { setupEquipmentHandlers } from "./handlers/equipmentHandlers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: true,
    },
  });

  mainWindow.webContents.on("context-menu", (e, params) => {
    if (params.isEditable) {
      const contextMenu = Menu.buildFromTemplate([
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { type: "separator" },
        { role: "selectAll" },
      ]);
      contextMenu.popup({ window: mainWindow });
    }
  });

  if (!app.isPackaged) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  const menuTemplate = [
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
  setupMemberHandlers();
  setupPlanHandlers();
  setupSubscriptionHandlers();
  setupAccessLogHandlers();
  setupTransactionHandlers();
  setupProductHandlers();
  setupSalesHistoryHandlers();
  setupEquipmentHandlers();

  ipcMain.handle("system:getMachineId", () => {
    try {
      const id = machineIdSync(); 
      return id;
    } catch (error) {
      console.error("Failed to get machine ID:", error);
      return null;
    }
  });

  ipcMain.on("log", (event, ...args) => {
    console.log("[RENDERER LOG]:", ...args);
  });

  ipcMain.handle("print-receipt", (event, html) => {
    const receiptWin = new BrowserWindow({ show: false });
    receiptWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    receiptWin.webContents.on('did-finish-load', () => {
      receiptWin.webContents.print({ silent: false }, () => {
        if (!receiptWin.isDestroyed()) receiptWin.destroy();
      });
    });
    receiptWin.webContents.on('did-fail-load', () => {
      if (!receiptWin.isDestroyed()) receiptWin.destroy();
    });
    setTimeout(() => {
      if (!receiptWin.isDestroyed()) receiptWin.destroy();
    }, 30000);
  });
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  try {
    console.log("Checkpointing and closing database connection...");
    try {
      db.pragma("wal_checkpoint(PASSIVE)");
    } catch (_) {}
    db.close();
    console.log("Database closed successfully.");
  } catch (err) {
    console.error("Error closing database:", err);
  }
});
