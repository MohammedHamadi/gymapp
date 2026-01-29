import { ipcMain } from "electron";
import { accessLogRepository } from "../repositories/accessLogRepository.js";

export function setupAccessLogHandlers() {
  ipcMain.handle("accessLogs:create", (event, log) => {
    return accessLogRepository.create(log);
  });

  ipcMain.handle("accessLogs:getByMember", (event, memberId) => {
    return accessLogRepository.findByMemberId(memberId);
  });

  ipcMain.handle("accessLogs:getRecent", (event, limit) => {
    return accessLogRepository.getRecentLogs(limit);
  });
}
