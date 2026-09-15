$ErrorActionPreference = "Stop"

$apiBaseUrl = $env:API_BASE_URL
if (-not $apiBaseUrl) {
  $apiBaseUrl = "http://localhost:4000"
}

$session = Invoke-RestMethod `
  -Method Post `
  -Uri "$apiBaseUrl/voice-sessions" `
  -ContentType "application/json" `
  -Body (@{
    userId = "smoke-test-user"
    language = "en"
    consentAccepted = $true
  } | ConvertTo-Json)

$audioBase64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("fake-audio-payload"))

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

$turn | ConvertTo-Json -Depth 4
