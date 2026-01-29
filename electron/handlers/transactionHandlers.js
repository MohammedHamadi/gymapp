import { ipcMain } from "electron";
import { transactionRepository } from "../repositories/transactionRepository.js";

export function setupTransactionHandlers() {
  ipcMain.handle("transactions:create", (event, transaction) => {
    return transactionRepository.create(transaction);
  });

  ipcMain.handle("transactions:getByMember", (event, memberId) => {
    return transactionRepository.findByMemberId(memberId);
  });

  ipcMain.handle("transactions:getDailyTotal", (event, date) => {
    return transactionRepository.getDailyTotal(date);
  });

  ipcMain.handle("transactions:getAll", () => {
    return transactionRepository.getAll();
  });
}
