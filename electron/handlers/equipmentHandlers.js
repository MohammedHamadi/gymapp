import { ipcMain, dialog, app } from "electron";
import path from "path";
import fs from "fs";
import * as equipmentRepo from "../repositories/equipmentRepository.js";

export function setupEquipmentHandlers() {
  ipcMain.handle("equipment:getAll", () => {
    return equipmentRepo.getAllEquipment();
  });

  ipcMain.handle("equipment:getById", (event, id) => {
    return equipmentRepo.getEquipmentById(id);
  });

  ipcMain.handle("equipment:create", (event, data) => {
    return equipmentRepo.createEquipment(data);
  });

  ipcMain.handle("equipment:update", (event, id, data) => {
    return equipmentRepo.updateEquipment(id, data);
  });

  ipcMain.handle("equipment:delete", (event, id) => {
    return equipmentRepo.deleteEquipment(id);
  });

  // Image picker: opens a file dialog and copies the selected image to app data
  ipcMain.handle("equipment:pickImage", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        { name: "Images", extensions: ["jpg", "jpeg", "png", "webp", "gif"] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const sourcePath = result.filePaths[0];
    const imagesDir = path.join(app.getPath("userData"), "equipment-images");

    // Ensure directory exists
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const ext = path.extname(sourcePath);
    const fileName = `equip_${Date.now()}${ext}`;
    const destPath = path.join(imagesDir, fileName);

    fs.copyFileSync(sourcePath, destPath);

    return destPath;
  });
}
