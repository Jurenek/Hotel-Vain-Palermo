
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/requests' -Method Post -ContentType 'application/json' -Body '{"guestId":"debug-test-5","type":"taxi","message":"Debug Msg 5"}' -UseBasicParsing
    Write-Host "Success: " $response.Content
} catch {
    Write-Host "Error: " $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()
        $body = $reader.ReadToEnd()
        Write-Host "Body: " $body
    }
}
