import { contextBridge, ipcRenderer } from "electron";

const api = {
  getStatus: () => ipcRenderer.invoke("bridge:get-status"),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  saveSettings: (update: { deviceToken?: string; autoStart?: boolean }) =>
    ipcRenderer.invoke("settings:set", update),
  onStatus: (callback: (payload: any) => void) => {
    const handler = (_event: unknown, payload: any) => callback(payload);
    ipcRenderer.on("bridge:status", handler);
    return () => ipcRenderer.removeListener("bridge:status", handler);
  },
};

contextBridge.exposeInMainWorld("bridgeApi", api);
