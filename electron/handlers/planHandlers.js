import { ipcMain } from "electron";
import { planRepository } from "../repositories/planRepository.js";

export function setupPlanHandlers() {
  ipcMain.handle("plans:getAll", () => {
    return planRepository.findAll();
  });

  ipcMain.handle("plans:getById", (event, id) => {
    return planRepository.findById(id);
  });

  ipcMain.handle("plans:create", (event, plan) => {
    return planRepository.create(plan);
  });

  ipcMain.handle("plans:update", (event, id, plan) => {
    return planRepository.update(id, plan);
  });

  ipcMain.handle("plans:delete", (event, id) => {
    return planRepository.delete(id);
  });
}
