$ErrorActionPreference = "Stop"

$apiBaseUrl = $env:BACKEND_API_BASE_URL
if (-not $apiBaseUrl) {
  $apiBaseUrl = "http://localhost:8000/api"
}

$health = Invoke-RestMethod -Method Get -Uri "$apiBaseUrl/health"
$session = Invoke-RestMethod `
  -Method Post `
  -Uri "$apiBaseUrl/voice-sessions" `
  -ContentType "application/json" `
  -Body (@{
    userId = "smoke-test-user"
    language = "en"
    consentAccepted = $true
  } | ConvertTo-Json)

$audioBase64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("fake-audio-payload-for-backend"))

$turn = Invoke-RestMethod `
  -Method Post `
  -Uri "$apiBaseUrl/voice-turns" `
  -ContentType "application/json" `
  -Body (@{
    sessionId = $session.sessionId
    audioFormat = "webm"
    sampleRateHz = 48000
    audioBase64 = $audioBase64
  } | ConvertTo-Json)

@{
  health = $health
  session = $session
  turn = $turn
} | ConvertTo-Json -Depth 5
