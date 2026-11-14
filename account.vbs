Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

WshShell.CurrentDirectory = scriptDir
WshShell.Run "cmd.exe /c cd /d """ & scriptDir & """ && start """" brave --app=http://localhost:3001 && npm run dev", 0, False
