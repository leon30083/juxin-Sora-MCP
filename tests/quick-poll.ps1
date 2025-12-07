param(
  [string]$TaskId,
  [int]$MaxMinutes = 8,
  [int]$IntervalSeconds = 6
)

$ErrorActionPreference = 'Stop'

$base = $Env:API_BASE_URL
if (-not $base -or $base.Trim().Length -eq 0) { $base = 'https://api.jxincm.cn' }
$token = $Env:API_KEY
if (-not $token) { throw 'Missing API_KEY environment variable' }

if (-not $TaskId) {
  $taskFile = Join-Path $PSScriptRoot 'last_task_id.txt'
  if (Test-Path $taskFile) { $TaskId = Get-Content $taskFile | Select-Object -First 1 }
}
if (-not $TaskId) { throw 'Missing task id (provide -TaskId or run quick-generate first)' }

$headers = @{ Authorization = "Bearer $token"; Accept = 'application/json' }
$deadline = (Get-Date).AddMinutes($MaxMinutes)

Write-Host "Polling status for task $TaskId (up to $MaxMinutes minutes, interval $IntervalSeconds s)..." -ForegroundColor Cyan

while ((Get-Date) -lt $deadline) {
  $uri = "$base/v1/videos/$TaskId"
  $resp = Invoke-RestMethod -Method Get -Uri $uri -Headers $headers
  $status = $resp.status
  $videoUrl = $resp.video_url
  $progress = $resp.progress
  $pct = $null
  if ($null -ne $progress) {
    if ([double]$progress -le 1) { $pct = [math]::Round([double]$progress * 100) } else { $pct = [math]::Round([double]$progress) }
  }
  if ($pct -ne $null) {
    Write-Host "status=$status progress=$pct%" -ForegroundColor Yellow
  } else {
    Write-Host "status=$status" -ForegroundColor Yellow
  }
  if ($videoUrl) {
    Write-Host "video_url: $videoUrl" -ForegroundColor Green
    $outFile = Join-Path $PSScriptRoot 'last_video_url.txt'
    Set-Content -Path $outFile -Value $videoUrl
    break
  }
  if ($status -eq 'failed') { Write-Host "Task failed" -ForegroundColor Red; break }
  Start-Sleep -Seconds $IntervalSeconds
}
