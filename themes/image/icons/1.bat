::═════代═══码═══开═══始═════
@echo off&setlocal enabledelayedexpansion
for /r %%i in (*.png) do (
echo .%%i {background:url^("%%i"^) no-repeat center center; } >> 1.css)
::═════代═══码═══结═══束═════