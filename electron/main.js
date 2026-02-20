import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import db from "./db/client.js";
import { setupMemberHandlers } from "./handlers/memberHandlers.js";
import { setupPlanHandlers } from "./handlers/planHandlers.js";
import { setupSubscriptionHandlers } from "./handlers/subscriptionHandlers.js";
import { setupAccessLogHandlers } from "./handlers/accessLogHandlers.js";
import { setupTransactionHandlers } from "./handlers/transactionHandlers.js";

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
      contextIsolation: true,
    },
  });

  if (!app.isPackaged) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  setupMemberHandlers();
  setupPlanHandlers();
  setupSubscriptionHandlers();
  setupAccessLogHandlers();
  setupTransactionHandlers();
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
