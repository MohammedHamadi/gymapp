import { ipcMain } from "electron";
import { accessLogRepository } from "../repositories/accessLogRepository.js";
import { accessControlService } from "../services/accessControlService.js";

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

  ipcMain.handle(
    "accessLogs:validate",
    (event, { id, type, subscriptionId }) => {
      try {
        return accessControlService.handleAccessRequest(
          id,
          type,
          subscriptionId || null,
        );
      } catch (err) {
        console.error("Access validation error:", err);
        return {
          status: "DENIED",
          reason: err?.message || "System error",
        };
      }
    },
  );

  ipcMain.handle("accessLogs:getCurrentlyInside", (event) => {
    return accessLogRepository.getCurrentlyInside();
  });

  ipcMain.handle("accessLogs:getTodayStats", (event) => {
    return accessLogRepository.getTodayStats();
  });
}
