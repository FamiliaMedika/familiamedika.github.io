@echo off
setlocal
title Sahabat Familia - Konfigurasi Auth Produksi
cd /d "%~dp0"

echo.
echo ================================================
echo  SAHABAT FAMILIA - KONFIGURASI AUTH PRODUKSI
echo ================================================
echo.
echo Skrip akan memperbaiki callback email, memasang
echo template resmi, dan menawarkan aktivasi Resend SMTP.
echo Token dan API key tidak ditampilkan atau disimpan.
echo.

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0Apply-SahabatAuth.ps1"
set "RESULT=%ERRORLEVEL%"

echo.
if "%RESULT%"=="0" (
  echo SELESAI. Konfigurasi telah terverifikasi.
) else (
  echo Konfigurasi belum selesai. Periksa pesan kesalahan di atas.
)
echo.
pause
exit /b %RESULT%
