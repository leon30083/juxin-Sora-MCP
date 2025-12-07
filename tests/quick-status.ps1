param(
  [string]$TaskId
)

$ErrorActionPreference = 'Stop'

$base = $Env:API_BASE_URL
if (-not $base -or $base.Trim().Length -eq 0) { $base = 'https://api.jxincm.cn' }
$token = $Env:API_KEY
if (-not $token) { throw 'Missing API_KEY environment variable' }

$headers = @{ Authorization = "Bearer $token"; Accept = 'application/json' }

if (-not $TaskId) {
  $taskFile = Join-Path $PSScriptRoot 'last_task_id.txt'
  if (Test-Path $taskFile) { $TaskId = Get-Content $taskFile | Select-Object -First 1 }
}

if (-not $TaskId) { throw 'Missing task id (provide -TaskId or run quick-generate first)' }

# OpenAI官方视频格式查询接口
$uri = "$base/v1/videos/$TaskId"
Write-Host "GET $uri" -ForegroundColor Cyan
$resp = Invoke-RestMethod -Method Get -Uri $uri -Headers $headers

$resp | ConvertTo-Json -Depth 8 | Write-Output

$videoUrl = $resp.video_url
$progress = $resp.progress
if ($null -ne $progress) {
  if ([double]$progress -le 1) { $pct = [math]::Round([double]$progress * 100) } else { $pct = [math]::Round([double]$progress) }
  Write-Host "progress=$pct%" -ForegroundColor Yellow
}
if ($videoUrl) { Write-Host "video_url: $videoUrl" -ForegroundColor Green }
