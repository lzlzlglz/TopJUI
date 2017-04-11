::═════代═══码═══开═══始═════
@echo off&setlocal enabledelayedexpansion
for /r %%i in (*.png) do (
echo ^<img src="%%i" alt="icon-%%i"^> >> index.html)
::═════代═══码═══结═══束═════