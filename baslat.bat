@echo off
echo Elion baslatiliyor...

start "Backend" cmd /k "cd /d C:\Users\heaven\OneDrive\Desktop\myProject\Elion\backend && venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000"

start "Frontend" cmd /k "cd /d C:\Users\heaven\OneDrive\Desktop\myProject\Elion\frontend && set BROWSER=none && npm start"

start "WhatsApp" cmd /k "cd /d C:\Users\heaven\OneDrive\Desktop\myProject\Elion\whatsapp-service && node index.js"

timeout /t 25

cd /d C:\Users\heaven\OneDrive\Desktop\myProject\Elion\electron-app
npm start