import { ipcMain } from "electron";
import { memberRepository } from "../repositories/memberRepository.js";

export function setupMemberHandlers() {
  ipcMain.handle("members:getAll", () => {
    return memberRepository.findAll();
  });

  ipcMain.handle("members:getById", (event, id) => {
    return memberRepository.findById(id);
  });

  ipcMain.handle("members:create", (event, data) => {
    return memberRepository.create(data);
  });

  ipcMain.handle("members:update", (event, id, data) => {
    return memberRepository.update(id, data);
  });

  ipcMain.handle("members:delete", (event, id) => {
    return memberRepository.delete(id);
  });
}
