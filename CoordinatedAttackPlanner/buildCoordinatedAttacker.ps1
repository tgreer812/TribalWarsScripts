# Build script for Coordinated Attack Planner
# Merges all module files into a single executable script

param(
    [string]$OutputPath = "..\CoordinatedAttackPlanner_merged.js"
)

Write-Host "Building Coordinated Attack Planner..." -ForegroundColor Green

# Define the source files in the order they should be merged
$moduleFiles = @(
    ".\modules\cap-state.js",
    ".\modules\cap-validation.js", 
    ".\modules\cap-ui.js"
)

$mainFile = ".\CoordinatedAttackPlanner.js"

# Check if all source files exist
$missingFiles = @()
foreach ($file in $moduleFiles + $mainFile) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "Error: Missing source files:" -ForegroundColor Red
    $missingFiles | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    exit 1
}

# Create output content
$outputContent = @()

# Add header comment
$outputContent += "// Coordinated Attack Planner - Merged Build"
$outputContent += "// Generated on: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$outputContent += "// This file is auto-generated. Do not edit directly."
$outputContent += ""

# Add each module file
foreach ($file in $moduleFiles) {
    Write-Host "Adding module: $file" -ForegroundColor Yellow
    
    $outputContent += "// =================================================="
    $outputContent += "// MODULE: $($file.Replace('.\', ''))"
    $outputContent += "// =================================================="
    $outputContent += ""
    
    # Read file content and skip the filepath comment line
    $content = Get-Content $file -Encoding UTF8 | Where-Object { $_ -notmatch "^// filepath:" }
    $outputContent += $content
    $outputContent += ""
}

# Add main file
Write-Host "Adding main file: $mainFile" -ForegroundColor Yellow
$outputContent += "// =================================================="
$outputContent += "// MAIN FILE"
$outputContent += "// =================================================="
$outputContent += ""

$mainContent = Get-Content $mainFile -Encoding UTF8 | Where-Object { $_ -notmatch "^// filepath:" }
$outputContent += $mainContent

# Write output file
$outputContent | Out-File -FilePath $OutputPath -Encoding UTF8

Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host "Output file: $OutputPath" -ForegroundColor Cyan
Write-Host "File size: $((Get-Item $OutputPath).Length) bytes" -ForegroundColor Cyan

# Optional: Copy to clipboard for easy pasting
if (Get-Command "Set-Clipboard" -ErrorAction SilentlyContinue) {
    $outputContent -join "`n" | Set-Clipboard
    Write-Host "Content copied to clipboard!" -ForegroundColor Green
}
