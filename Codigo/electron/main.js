import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        backgroundColor: '#0f1115',
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            // Uncomment when you need to expose safe APIs
            // preload: path.join(__dirname, 'preload.js'),
        },
        show: false,
    });

    win.once('ready-to-show', () => win.show());

    if (isDev) {
        win.loadURL('http://localhost:8080');
        win.webContents.openDevTools({ mode: 'detach' });
    } else {
        const indexPath = path.resolve(__dirname, '../dist/index.html');
        win.loadFile(indexPath);
    }

    // Open external links in default browser
    win.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        const all = BrowserWindow.getAllWindows();
        if (all.length) {
            const win = all[0];
            if (win.isMinimized()) win.restore();
            win.focus();
        }
    });

    app.whenReady().then(() => {
        app.setAppUserModelId('HelpDeskUNIP');
        createWindow();
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) createWindow();
        });
    });
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
