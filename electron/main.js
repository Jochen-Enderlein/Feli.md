const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');

let mainWindow;
const configPath = path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
  return { vaultPath: null };
}

function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#050505',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Hide the menu bar
  mainWindow.setMenuBarVisibility(false);
  // Also remove it completely to prevent Alt-key reveal
  Menu.setApplicationMenu(null);

  const url = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../out/index.html')}`;
  
  mainWindow.loadURL(url);

  /* 
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  */
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('get-vault-path', () => {
  const config = loadConfig();
  return config.vaultPath;
});

ipcMain.handle('set-vault-path', (event, vaultPath) => {
  saveConfig({ vaultPath });
  mainWindow.reload();
  return true;
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('save-note-as-pdf', async (event, title) => {
  try {
    const pdfPath = await dialog.showSaveDialog(mainWindow, {
      title: 'Export to PDF',
      defaultPath: `${title || 'note'}.pdf`,
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    });

    if (pdfPath.canceled) return false;

    // Wait long enough for Excalidraw and syntax highlighting to re-render in print mode
    await new Promise(resolve => setTimeout(resolve, 2000));

    const options = {
      margins: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      },
      pageSize: 'A4',
      printBackground: true,
      displayHeaderFooter: false,
      preferCSSPageSize: true
    };

    const data = await mainWindow.webContents.printToPDF(options);
    fs.writeFileSync(pdfPath.filePath, data);
    return true;
  } catch (error) {
    console.error('Failed to export PDF:', error);
    return false;
  }
});
