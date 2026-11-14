Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd.exe /c cd /d ""E:\projects\staging\accountz"" && start """" brave --app=http://localhost:3001 && npm run dev", 0, False