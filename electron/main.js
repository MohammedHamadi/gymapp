import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import db from "./db/client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false, // For simplicity in this wrap, though contextIsolation: true is better for security
    },
  });

  // In development, load the local Vite server
  if (!app.isPackaged) {
    mainWindow.loadURL("http://localhost:5173");
    // Open the DevTools.
    // mainWindow.webContents.openDevTools();
  } else {
    // In production, load the index.html from the dist folder
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
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
    console.log("Closing database connection...");
    db.close();
    console.log("Database closed successfully.");
  } catch (err) {
    console.error("Error closing database:", err);
  }
});
