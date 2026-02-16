const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const { fork } = require('child_process');
const Store = require('electron-store');

const store = new Store();
let mainWindow;
let serverProcess;

// Get paths based on environment
const isDev = !app.isPackaged;

// Server path
const serverPath = isDev
    ? path.join(__dirname, '../server/index.js')
    : path.join(process.resourcesPath, 'server/index.js');

// Client path - fixed for production
const clientPath = isDev
    ? 'http://localhost:5173'
    : url.format({
        pathname: path.join(__dirname, '../client/dist/index.html'),
        protocol: 'file:',
        slashes: true
    });

console.log('Environment:', isDev ? 'Development' : 'Production');
console.log('Client path:', clientPath);
console.log('Server path:', serverPath);

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        show: false,
        backgroundColor: '#0a0a0a',
        title: 'Equinox Dashboard'
    });

    // Show window when ready to prevent flashing
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Add error handling for loading
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Failed to load:', errorCode, errorDescription);
        console.error('Attempted to load:', clientPath);
    });

    // Log when content loads successfully
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('Content loaded successfully');
    });

    // Load the client
    if (isDev) {
        // In development, wait a bit for Vite to start
        setTimeout(() => {
            mainWindow.loadURL(clientPath);
            mainWindow.webContents.openDevTools();
        }, 2000);
    } else {
        // In production, load immediately
        console.log('Loading client from:', clientPath);
        mainWindow.loadURL(clientPath).catch(err => {
            console.error('Error loading URL:', err);
        });
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function startServer() {
    return new Promise((resolve, reject) => {
        // Set up environment for the server
        const env = {
            ...process.env,
            PORT: '3000',
            NODE_ENV: isDev ? 'development' : 'production'
        };

        // In production, set up the database path in user data
        if (!isDev) {
            const userDataPath = app.getPath('userData');
            const dbPath = path.join(userDataPath, 'database.db');
            const seedDbPath = path.join(process.resourcesPath, 'server/prisma/seed.db');

            // Copy seed database if it doesn't exist
            const fs = require('fs');
            if (!fs.existsSync(dbPath) && fs.existsSync(seedDbPath)) {
                fs.copyFileSync(seedDbPath, dbPath);
                console.log('Database initialized from seed data');
            }

            env.DATABASE_URL = `file:${dbPath}`;
            env.SESSION_SECRET = store.get('sessionSecret', generateSessionSecret());
            store.set('sessionSecret', env.SESSION_SECRET);
        }

        console.log('Starting server at:', serverPath);
        serverProcess = fork(serverPath, [], {
            env,
            stdio: 'inherit'
        });

        serverProcess.on('error', (err) => {
            console.error('Server process error:', err);
            reject(err);
        });

        // Give the server time to start
        setTimeout(() => {
            console.log('Server started successfully');
            resolve();
        }, 2000);
    });
}

function generateSessionSecret() {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
}

app.whenReady().then(async () => {
    try {
        if (!isDev) {
            await startServer();
        }
        createWindow();
    } catch (error) {
        console.error('Failed to start application:', error);
        app.quit();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('before-quit', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});
