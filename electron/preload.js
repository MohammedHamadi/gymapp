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
});
