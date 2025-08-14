const { app, BrowserWindow, shell } = require('electron');

let mainWindow;

function createMainWindow() {
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		show: false,
		title: 'Planner',
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	const startUrl = 'http://localhost:3000';
	mainWindow.loadURL(startUrl);

	mainWindow.once('ready-to-show', () => {
		mainWindow.show();
	});

	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: 'deny' };
	});

	mainWindow.on('closed', () => {
		mainWindow = null;
	});
}

app.whenReady().then(() => {
	createMainWindow();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createMainWindow();
		}
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
