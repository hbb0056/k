@echo off
echo Kelime Avi - Yerel sunucu baslatiliyor...
echo.
echo Tarayicida su adresi acin:  http://localhost:3000
echo.
echo Yonetici:  http://localhost:3000/admin.html
echo Katilimci: http://localhost:3000/participant.html
echo.
npx serve . -l 3000
pause
