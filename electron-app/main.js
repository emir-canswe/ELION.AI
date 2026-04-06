const { app, BrowserWindow, Tray, Menu, nativeImage } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const fs = require("fs");

const FRONTEND_PORT = process.env.ELION_FRONTEND_PORT || "3000";
const FRONTEND_URL = `http://127.0.0.1:${FRONTEND_PORT}`;
const MAX_START_ATTEMPTS = 60;

let mainWindow;
let tray;
let backendProcess;
let frontendProcess;
let whatsappProcess;

function logChild(name, proc) {
    if (!proc) return;
    proc.stdout?.on("data", (chunk) => process.stdout.write(`[${name}] ${chunk}`));
    proc.stderr?.on("data", (chunk) => process.stderr.write(`[${name}] ${chunk}`));
    proc.on("exit", (code, signal) => {
        console.log(`[${name}] process exited code=${code} signal=${signal ?? ""}`);
    });
}

function startBackend() {
    const backendRoot = path.join(__dirname, "../backend");
    const isWin = process.platform === "win32";
    const pythonExe = isWin
        ? path.join(backendRoot, "venv", "Scripts", "python.exe")
        : path.join(backendRoot, "venv", "bin", "python");

    if (!fs.existsSync(pythonExe)) {
        console.error(
            `[backend] Python venv bulunamadı: ${pythonExe}\n` +
                "Çözüm: backend klasöründe venv oluşturup bağımlılıkları kurun (README)."
        );
        return;
    }

    backendProcess = spawn(
        pythonExe,
        ["-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"],
        { cwd: backendRoot, shell: false, env: process.env }
    );
    logChild("backend", backendProcess);
}

function startFrontend() {
    const frontendRoot = path.join(__dirname, "../frontend");
    const isWin = process.platform === "win32";
    const npmCmd = isWin ? "npm.cmd" : "npm";

    frontendProcess = spawn(npmCmd, ["start"], {
        cwd: frontendRoot,
        shell: false,
        env: { ...process.env, BROWSER: "none", PORT: FRONTEND_PORT },
    });
    logChild("frontend", frontendProcess);
}

function startWhatsapp() {
    const root = path.join(__dirname, "../whatsapp-service");
    if (!fs.existsSync(path.join(root, "node_modules"))) {
        console.error("[whatsapp] node_modules eksik. whatsapp-service içinde: npm install");
        return;
    }

    whatsappProcess = spawn("node", ["index.js"], {
        cwd: root,
        shell: false,
        env: process.env,
    });
    logChild("whatsapp", whatsappProcess);
}

function showFrontendLoadError(url) {
    const msg = `Arayüz başlatılamadı. ${url} yanıt vermiyor. frontend klasöründe npm install && npm start deneyin.`;
    const html = `<!DOCTYPE html><html style="background:#111827;color:#f87171;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
  <div style="max-width:32rem;padding:1.5rem">
    <h1 style="font-size:1.35rem;color:#f87171">Arayüz başlatılamadı</h1>
    <p style="color:#9ca3af;margin-top:1rem">Beklenen adres: <code style="color:#e5e7eb">${url}</code></p>
    <p style="color:#9ca3af;margin-top:0.75rem;line-height:1.5">${msg}</p>
    <p style="color:#9ca3af;margin-top:0.75rem">Port çakışması varsa ortam değişkeni <code>ELION_FRONTEND_PORT</code> ile başka bir port verin (frontend ve bu değişken aynı olmalı).</p>
  </div></html>`;
    mainWindow.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));
}

function bekleVeYukle(url, deneme = 0) {
    http.get(url, (res) => {
        res.resume();
        if (res.statusCode === 200) {
            mainWindow.loadURL(url);
        } else if (deneme < MAX_START_ATTEMPTS) {
            setTimeout(() => bekleVeYukle(url, deneme + 1), 2000);
        } else {
            showFrontendLoadError(url);
        }
    }).on("error", () => {
        if (deneme < MAX_START_ATTEMPTS) {
            setTimeout(() => bekleVeYukle(url, deneme + 1), 2000);
        } else {
            showFrontendLoadError(url);
        }
    });
}

function createTrayIcon() {
    const icoPath = path.join(__dirname, "icon.ico");
    if (fs.existsSync(icoPath)) {
        return nativeImage.createFromPath(icoPath);
    }
    const png = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64"
    );
    return nativeImage.createFromBuffer(png);
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 850,
        title: "Elion AI",
        backgroundColor: "#111827",
        webPreferences: { nodeIntegration: false, contextIsolation: true },
    });

    mainWindow.loadURL(
        "data:text/html,<html style='background:#111827;color:#06b6d4;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0'><div style='text-align:center'><h1 style='font-size:3rem'>⚡ Elion AI</h1><p style='font-size:1.2rem;color:#9ca3af'>Başlatılıyor, lütfen bekleyin...</p></div></html>"
    );

    bekleVeYukle(FRONTEND_URL);

    mainWindow.on("close", (e) => {
        e.preventDefault();
        mainWindow.hide();
    });
}

function quitAll() {
    for (const p of [backendProcess, frontendProcess, whatsappProcess]) {
        if (p && !p.killed) {
            try {
                p.kill();
            } catch (_) {
                /* ignore */
            }
        }
    }
    app.exit(0);
}

function createTray() {
    tray = new Tray(createTrayIcon());
    const menu = Menu.buildFromTemplate([
        { label: "Elion'u Aç", click: () => mainWindow.show() },
        {
            label: "Çıkış",
            click: () => quitAll(),
        },
    ]);
    tray.setToolTip("Elion AI");
    tray.setContextMenu(menu);
    tray.on("click", () => mainWindow.show());
}

app.whenReady().then(() => {
    startBackend();
    startFrontend();
    startWhatsapp();
    createWindow();
    createTray();
});

app.on("window-all-closed", (e) => e.preventDefault());
