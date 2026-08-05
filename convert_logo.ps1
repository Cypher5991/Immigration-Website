Add-Type -AssemblyName System.Drawing

$inputPath = "C:\Users\Admin\.gemini\antigravity\scratch\alc_services_clone\images\alc_logo.png"
$outputPath = "C:\Users\Admin\.gemini\antigravity\scratch\alc_services_clone\images\alc_logo_white.png"

$bmp = [System.Drawing.Bitmap]::FromFile($inputPath)
$newBmp = New-Object System.Drawing.Bitmap $bmp.Width, $bmp.Height

for ($x = 0; $x -lt $bmp.Width; $x++) {
    for ($y = 0; $y -lt $bmp.Height; $y++) {
        $pixel = $bmp.GetPixel($x, $y)
        
        # Calculate brightness (0 to 255)
        $brightness = [int](($pixel.R + $pixel.G + $pixel.B) / 3)
        
        if ($brightness -gt 215) {
            # White background becomes transparent
            $newBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 255, 255, 255))
        } else {
            # Dark / logo pixels become crisp solid white with smooth alpha
            $alpha = [Math]::Min(255, [int]((255 - $brightness) * 1.5))
            $newBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, 255, 255, 255))
        }
    }
}

$newBmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$newBmp.Dispose()

Write-Host "White logo with transparent background saved to $outputPath"
