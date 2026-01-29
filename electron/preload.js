import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  // Generic invoke wrapper for flexibility
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),

  // Specific methods can be defined here if preferred for stricter typing later
  members: {
    getAll: () => ipcRenderer.invoke("members:getAll"),
    getById: (id) => ipcRenderer.invoke("members:getById", id),
    create: (data) => ipcRenderer.invoke("members:create", data),
    update: (id, data) => ipcRenderer.invoke("members:update", id, data),
    delete: (id) => ipcRenderer.invoke("members:delete", id),
  },
  plans: {
    getAll: () => ipcRenderer.invoke("plans:getAll"),
    getById: (id) => ipcRenderer.invoke("plans:getById", id),
    create: (data) => ipcRenderer.invoke("plans:create", data),
    update: (id, data) => ipcRenderer.invoke("plans:update", id, data),
    delete: (id) => ipcRenderer.invoke("plans:delete", id),
  },
  subscriptions: {
    getAll: () => ipcRenderer.invoke("subscriptions:getAll"),
    getById: (id) => ipcRenderer.invoke("subscriptions:getById", id),
    getByMember: (memberId) =>
      ipcRenderer.invoke("subscriptions:getByMember", memberId),
    getActiveByMember: (memberId) =>
      ipcRenderer.invoke("subscriptions:getActiveByMember", memberId),
    create: (data) => ipcRenderer.invoke("subscriptions:create", data),
    update: (id, data) => ipcRenderer.invoke("subscriptions:update", id, data),
    updateStatus: (id, status) =>
      ipcRenderer.invoke("subscriptions:updateStatus", id, status),
    decrementSession: (id) =>
      ipcRenderer.invoke("subscriptions:decrementSession", id),
    delete: (id) => ipcRenderer.invoke("subscriptions:delete", id),
  },
  accessLogs: {
    create: (data) => ipcRenderer.invoke("accessLogs:create", data),
    getByMember: (memberId) =>
      ipcRenderer.invoke("accessLogs:getByMember", memberId),
    getRecent: (limit) => ipcRenderer.invoke("accessLogs:getRecent", limit),
  },
  transactions: {
    create: (data) => ipcRenderer.invoke("transactions:create", data),
    getByMember: (memberId) =>
      ipcRenderer.invoke("transactions:getByMember", memberId),
    getDailyTotal: (date) =>
      ipcRenderer.invoke("transactions:getDailyTotal", date),
    getAll: () => ipcRenderer.invoke("transactions:getAll"),
  },
});
