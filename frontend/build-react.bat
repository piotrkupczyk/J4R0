@echo off
setlocal enabledelayedexpansion

REM ======= ŚCIEŻKI (dopasuj w razie potrzeby) =======
set FRONTEND_DIR=%~dp0
set REACT_DIR=%FRONTEND_DIR%react
set DIST_SRC=%REACT_DIR%\dist
set DIST_DST=%FRONTEND_DIR%react-dist

echo [1/5] Wejście do katalogu React: "%REACT_DIR%"
pushd "%REACT_DIR%" || (echo Nie znaleziono katalogu "%REACT_DIR%" && exit /b 1)

echo [2/5] Build (npm run build)...
call npm run build || (echo Błąd: npm run build && popd && exit /b 1)

echo [3/5] Czyścimy "%DIST_DST%"...
if exist "%DIST_DST%" rmdir /s /q "%DIST_DST%"
mkdir "%DIST_DST%"

echo [4/5] Kopiujemy dist -> react-dist...
xcopy "%DIST_SRC%\*" "%DIST_DST%\" /E /I /Y >nul

popd

echo [5/5] Duplikujemy zhaszowane pliki do stałych nazw...
REM Szukamy pierwszego index-*.js i index-*.css w react-dist\assets
for /f "usebackq delims=" %%F in (`powershell -NoProfile -Command ^
  "Get-ChildItem -Path '%DIST_DST%\assets' -Filter 'index-*.js' | Select-Object -First 1 -ExpandProperty FullName"`) do set MAIN_JS=%%F

for /f "usebackq delims=" %%F in (`powershell -NoProfile -Command ^
  "Get-ChildItem -Path '%DIST_DST%\assets' -Filter 'index-*.css' | Select-Object -First 1 -ExpandProperty FullName"`) do set MAIN_CSS=%%F

if not defined MAIN_JS (
  echo Nie znaleziono pliku JS index-*.js w %DIST_DST%\assets
  exit /b 1
)

copy /Y "%MAIN_JS%" "%DIST_DST%\assets\index.js" >nul
if defined MAIN_CSS (
  copy /Y "%MAIN_CSS%" "%DIST_DST%\assets\index.css" >nul
) else (
  echo Uwaga: brak pliku CSS index-*.css (to normalne, jeśli Vite nie wygenerował CSS).
)

echo ✅ Gotowe. Odśwież: http://127.0.0.1:5500/builder.html
