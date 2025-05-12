const { contextBridge, ipcRenderer } = require('electron');

// 暴露给渲染进程的API
contextBridge.exposeInMainWorld('electronAPI', {
  // 选择单个图片文件
  selectImage: () => ipcRenderer.invoke('select-images').then(images => images && images.length > 0 ? images[0] : null),
  
  // 选择图片文件
  selectImages: () => ipcRenderer.invoke('select-images'),
  
  // 保存图片
  saveImage: (imageData, defaultPath) => ipcRenderer.invoke('save-image', imageData, defaultPath),
  
  // 选择目录
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  
  // 打开文件
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  
  // 处理拖放的文件
  handleDroppedFiles: (filePaths) => ipcRenderer.invoke('handle-dropped-files', filePaths)
}); 