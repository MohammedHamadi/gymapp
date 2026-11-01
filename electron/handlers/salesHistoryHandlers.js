import { ipcMain } from "electron";
import * as salesRepo from "../repositories/salesHistoryRepository.js";

export function setupSalesHistoryHandlers() {
  ipcMain.handle("sales:create", (event, data, requestId) => {
    return salesRepo.createSale(data, requestId);
  });

  ipcMain.handle("sales:createBatch", (event, data, requestId) => {
    return salesRepo.createSalesBatch(data, requestId);
  });

  ipcMain.handle("sales:getAll", () => {
    return salesRepo.getAllSales();
  });

  ipcMain.handle("sales:getRecent", (event, limit) => {
    return salesRepo.getRecentSales(limit);
  });
}
