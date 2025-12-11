$ErrorActionPreference = 'Stop'

$base = $Env:API_BASE_URL
if (-not $base -or $base.Trim().Length -eq 0) { $base = 'https://api.jxincm.cn' }
$token = $Env:API_KEY
if (-not $token) { throw 'Missing API_KEY environment variable' }

$headers = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json'; Accept = 'application/json' }

$bodyObj = @{ 
  model = 'sora-2'; 
  prompt = '在海滩上度假的快乐场景。'; 
  duration = 15; 
  orientation = 'landscape';
  images = @();
}

$bodyJson = $bodyObj | ConvertTo-Json -Depth 5

$uri = "$base/v1/video/create"

Write-Host "POST $uri" -ForegroundColor Cyan
$resp = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -Body $bodyJson

$taskId = $resp.task_id
if (-not $taskId) { $taskId = $resp.id }

if ($taskId) {
  Write-Host "task_id: $taskId" -ForegroundColor Green
  Set-Content -Path (Join-Path $PSScriptRoot 'last_task_id.txt') -Value $taskId
} else {
  Write-Host "No task id in response:" -ForegroundColor Yellow
  $resp | ConvertTo-Json -Depth 6 | Write-Output
}
