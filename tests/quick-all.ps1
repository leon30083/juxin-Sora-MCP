$ErrorActionPreference = 'Stop'

Set-Item -Path Env:API_BASE_URL -Value 'https://api.jxincm.cn'
if (-not $Env:API_KEY) { throw 'Missing API_KEY environment variable' }

# 1. Generate
& "$PSScriptRoot/quick-generate.ps1"

# 2. Poll until video_url
& "$PSScriptRoot/quick-poll.ps1" -MaxMinutes 8 -IntervalSeconds 6

Write-Host "Done" -ForegroundColor Green
