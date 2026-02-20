import { ipcMain } from "electron";
import { subscriptionRepository } from "../repositories/subscriptionRepository.js";

export function setupSubscriptionHandlers() {
  ipcMain.handle("subscriptions:getAll", () => {
    return subscriptionRepository.findAll();
  });

  ipcMain.handle("subscriptions:getById", (event, id) => {
    return subscriptionRepository.findById(id);
  });

  ipcMain.handle("subscriptions:getByMember", (event, memberId) => {
    return subscriptionRepository.findByMemberId(memberId);
  });

  ipcMain.handle("subscriptions:findActiveByMemberId", (event, memberId) => {
    return subscriptionRepository.findActiveByMemberId(memberId);
  });

  ipcMain.handle("subscriptions:getStats", () =>
    subscriptionRepository.getStats(),
  );
  ipcMain.handle("subscriptions:getExpiring", () =>
    subscriptionRepository.getExpiring(),
  );
  ipcMain.handle("subscriptions:renew", (event, memberId, subscription) =>
    subscriptionRepository.renew(memberId, subscription),
  );

  ipcMain.handle("subscriptions:create", (event, subscription) => {
    return subscriptionRepository.create(subscription);
  });

  ipcMain.handle("subscriptions:update", (event, id, subscription) => {
    return subscriptionRepository.update(id, subscription);
  });

  ipcMain.handle("subscriptions:updateStatus", (event, id, status) => {
    return subscriptionRepository.updateStatus(id, status);
  });

  ipcMain.handle("subscriptions:decrementSession", (event, id) => {
    return subscriptionRepository.decrementSession(id);
  });

  ipcMain.handle("subscriptions:delete", (event, id) => {
    return subscriptionRepository.delete(id);
  });
}
