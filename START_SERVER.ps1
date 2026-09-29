Set-Location $PSScriptRoot
Start-Process powershell -ArgumentList '-NoExit','-Command',"Set-Location '$PSScriptRoot'; py -m http.server 8080"
Start-Sleep -Seconds 2
Start-Process 'http://localhost:8080'
