const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// 判断是否是开发环境
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 加载应用
  if (isDev) {
    // 开发环境下加载Vite开发服务器
    mainWindow.loadURL('http://localhost:5173');
    // 打开开发者工具
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境下加载打包后的index.html
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 当窗口关闭时触发的事件
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 除了macOS外，当所有窗口关闭时退出应用
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// 处理选择图片事件
ipcMain.handle('select-images', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
    ]
  });
  
  if (!result.canceled) {
    const images = [];
    for (const filePath of result.filePaths) {
      try {
        const imageBuffer = fs.readFileSync(filePath);
        const base64Image = `data:image/${filePath.split('.').pop().toLowerCase()};base64,${imageBuffer.toString('base64')}`;
        images.push({
          path: filePath,
          name: path.basename(filePath),
          preview: base64Image
        });
      } catch (error) {
        console.error('Error reading image file:', error);
      }
    }
    return images;
  }
  return [];
});

// 处理保存图片事件
ipcMain.handle('save-image', async (event, imageData, defaultPath) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultPath,
      filters: [
        { name: 'JPG图片', extensions: ['jpg', 'jpeg'] },
        { name: 'PNG图片', extensions: ['png'] },
        { name: 'WebP图片', extensions: ['webp'] },
        { name: '所有文件', extensions: ['*'] }
      ],
      properties: ['createDirectory', 'showOverwriteConfirmation']
    });
    
    if (!result.canceled && result.filePath) {
      // 将base64编码的图片数据写入文件
      fs.writeFileSync(result.filePath, Buffer.from(imageData, 'base64'));
      console.log('图片已保存至:', result.filePath);
      return result.filePath;
    }
    return null;
  } catch (error) {
    console.error('保存图片出错:', error);
    throw error;
  }
});

// 处理选择目录事件
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// 处理打开文件事件
ipcMain.handle('open-file', (event, filePath) => {
  try {
    // 使用electron的shell模块打开文件
    const { shell } = require('electron');
    shell.openPath(filePath);
    return true;
  } catch (error) {
    console.error('打开文件出错:', error);
    return false;
  }
});

// 处理拖放文件事件
ipcMain.handle('handle-dropped-files', async (event, filePaths) => {
  try {
    const images = [];
    for (const filePath of filePaths) {
      try {
        const imageBuffer = fs.readFileSync(filePath);
        const extension = path.extname(filePath).substring(1).toLowerCase();
        const base64Image = `data:image/${extension};base64,${imageBuffer.toString('base64')}`;
        images.push({
          path: filePath,
          name: path.basename(filePath),
          preview: base64Image,
          size: imageBuffer.length
        });
      } catch (error) {
        console.error('Error reading dropped image file:', error);
      }
    }
    return images;
  } catch (error) {
    console.error('处理拖放文件出错:', error);
    return [];
  }
}); 