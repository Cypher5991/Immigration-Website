$WshShell = New-Object -ComObject WScript.Shell

# 1. Shortcut to website index.html
$ShortcutWeb = $WshShell.CreateShortcut("C:\Users\Admin\Desktop\ALC Services Website.lnk")
$ShortcutWeb.TargetPath = "C:\Users\Admin\.gemini\antigravity\scratch\alc_services_clone\index.html"
$ShortcutWeb.WorkingDirectory = "C:\Users\Admin\.gemini\antigravity\scratch\alc_services_clone"
$ShortcutWeb.Description = "Open ALC Services Website"
$ShortcutWeb.Save()

# 2. Shortcut to project folder
$ShortcutFolder = $WshShell.CreateShortcut("C:\Users\Admin\Desktop\ALC Services Project.lnk")
$ShortcutFolder.TargetPath = "C:\Users\Admin\.gemini\antigravity\scratch\alc_services_clone"
$ShortcutFolder.Description = "ALC Services Project Folder"
$ShortcutFolder.Save()

Write-Host "Desktop shortcuts created successfully!"
