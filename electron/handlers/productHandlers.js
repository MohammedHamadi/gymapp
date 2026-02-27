import { ipcMain } from "electron";
import * as productRepo from "../repositories/productRepository.js";

export function setupProductHandlers() {
  ipcMain.handle("products:getAll", () => {
    return productRepo.getAllProducts();
  });

  ipcMain.handle("products:getById", (event, id) => {
    return productRepo.getProductById(id);
  });

  ipcMain.handle("products:create", (event, data) => {
    return productRepo.createProduct(data);
  });

  ipcMain.handle("products:update", (event, id, data) => {
    return productRepo.updateProduct(id, data);
  });

  ipcMain.handle("products:delete", (event, id) => {
    return productRepo.deleteProduct(id);
  });
}
