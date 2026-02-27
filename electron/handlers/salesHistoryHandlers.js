import { ipcMain } from "electron";
import * as salesRepo from "../repositories/salesHistoryRepository.js";

export function setupSalesHistoryHandlers() {
  ipcMain.handle("sales:create", (event, data) => {
    return salesRepo.createSale(data);
  });

  ipcMain.handle("sales:createBatch", (event, data) => {
    return salesRepo.createSalesBatch(data);
  });

  ipcMain.handle("sales:getAll", () => {
    return salesRepo.getAllSales();
  });

  ipcMain.handle("sales:getRecent", (event, limit) => {
    return salesRepo.getRecentSales(limit);
  });
}
