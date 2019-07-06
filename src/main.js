// External
import { app, BrowserWindow, Tray, Menu } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import module from 'module';
import sourceMapSupport from 'source-map-support';
import devToolsInstall, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} from 'electron-devtools-installer';
import fs from 'fs-extra';

// Internal
import fileServer from './fileServer';
import configuration from 'api/configuration';
import { LoadSettings, UpdateSettings } from 'api/settings';
import core from 'api/core';

let mainWindow;
let resizeTimer;

// Global Objects
global.fileServer = fileServer;
global.core = new core();
global.autoUpdater = autoUpdater;
global.forceQuit = false;

app.setAppUserModelId(APP_ID);

// Enable source map support
if (process.env.NODE_ENV === 'production') {
  sourceMapSupport.install();
}

const p = path.join(process.cwd(), 'app', 'node_modules');
module.globalPaths.push(p);

// Enable development tools for REACT and REDUX
const installExtensions = async () => {
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  return Promise.all([
    devToolsInstall(REACT_DEVELOPER_TOOLS, forceDownload),
    devToolsInstall(REDUX_DEVTOOLS, forceDownload),
  ]).catch();
};

function setupTray(mainWindow) {
  const fileName =
    process.platform == 'darwin'
      ? 'Nexus_Tray_Icon_Template_16.png'
      : 'Nexus_Tray_Icon_32.png';
  const trayImage = path.join(configuration.GetAssetsDir(), 'tray', fileName);
  const tray = new Tray(trayImage);

  const pressedFileName = 'Nexus_Tray_Icon_Highlight_16.png';
  const pressedImage = path.join(
    configuration.GetAssetsDir(),
    'tray',
    pressedFileName
  );
  tray.setPressedImage(pressedImage);
  tray.setToolTip('Nexus Wallet');
  tray.setTitle('Nexus Wallet');

  app.on('before-quit', () => {
    global.forceQuit = true;
  });
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Nexus Wallet',
      click: function() {
        mainWindow.show();
        if (process.platform === 'darwin') {
          app.dock.show();
        }
      },
    },
    {
      label: 'Quit Nexus Wallet',
      click() {
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    mainWindow.show();
    if (process.platform === 'darwin') {
      app.dock.show();
    }
  });

  return tray;
}

//
// Create Application Window
//

function createWindow() {
  const settings = LoadSettings();
  const fileName =
    process.platform == 'darwin' ? 'nexuslogo.ico' : 'Nexus_App_Icon_64.png';
  const iconPath = path.join(configuration.GetAssetsDir(), 'tray', fileName);

  // Create the main browser window
  mainWindow = new BrowserWindow({
    width: settings.windowWidth,
    height: settings.windowHeight,
    minWidth: 1022,
    minHeight: 713,
    icon: iconPath,
    backgroundColor: '#232c39',
    show: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  global.tray = setupTray(mainWindow);

  // Load the index.html into the new browser window
  const htmlPath =
    process.env.NODE_ENV === 'development' ? '../src/app.html' : 'app.html';
  mainWindow.loadURL(`file://${path.resolve(__dirname, htmlPath)}`);

  // Show the window only once the contents finish loading, then check for updates
  mainWindow.webContents.on('did-finish-load', function() {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }

    mainWindow.show();
    mainWindow.focus();
    // UNCOMMENT THIS TO OPEN DEVTOOLS FROM THE MAIN PROCESS
    // mainWindow.webContents.openDevTools();

    //updateApplication(); // if updates are checked in app.on('ready') there is a chance the event doesn't make it to the UI if that hasn't loaded yet, this is safer
  });

  // Save the window dimensions once the resize event is completed
  mainWindow.on('resize', function(event) {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(function() {
      // Resize event has been completed
      UpdateSettings({
        windowWidth: mainWindow.getBounds().width,
        windowHeight: mainWindow.getBounds().height,
      });
    }, 250);
  });

  // e.preventDefault doesn't work on renderer process so leave it in the main process
  // https://github.com/electron/electron/issues/4473
  mainWindow.on('close', e => {
    e.preventDefault();
  });
}

//If you have a QT folder, back up that data just in case.
async function backUpQT() {
  const doNotCopyList = [
    'blk0001.dat',
    'blk0002.dat',
    'database',
    'keychain',
    'datachain',
    '__db.001',
    '__db.002',
    '__db.003',
    '__db.004',
    '__db.005',
  ];
  const exists = await fs.pathExists(configuration.GetCoreDataDir());
  if (exists) {
    const backupexists = await fs.pathExists(
      configuration.GetCoreDataDir() + '_OldQtBackUp'
    );
    if (!backupexists) {
      const filterFunc = (src, dest) => {
        const filename = src && src.replace(/^.*[\\\/]/, '');
        if (doNotCopyList.includes(filename)) {
          return false;
        } else {
          return true;
        }
      };
      fs.copy(
        configuration.GetCoreDataDir(),
        configuration.GetCoreDataDir() + '_OldQtBackUp',
        { filter: filterFunc },
        err => {
          if (err) return console.error(err);

          console.log('QT Backup success!');
        }
      );
    }
  }
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      mainWindow.show();
      if (process.platform === 'darwin') {
        app.dock.show();
      }
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // Application Startup
  app.on('ready', async () => {
    await backUpQT();
    createWindow();
    global.core.start();

    const settings = LoadSettings();
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true' ||
      settings.devMode
    ) {
      installExtensions();
    }
  });
}