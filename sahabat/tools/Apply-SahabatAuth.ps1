[CmdletBinding()]
param(
  [switch]$ConfigureSmtp,
  [switch]$SkipSmtp,
  [string]$SenderEmail = "noreply@auth.familiamedika.id"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$ProjectRef = "cvfuuflnfexaqnncgjmw"
$ManagementEndpoint = "https://api.supabase.com/v1/projects/$ProjectRef/config/auth"
$ProductionUrl = "https://www.familiamedika.id/sahabat/"
$SenderName = "Sahabat Familia by Familia Medika"
$TemplateBaseUrl = "https://raw.githubusercontent.com/FamiliaMedika/familiamedika.github.io/main/sahabat/email-templates"

function Write-Section([string]$Text) {
  Write-Host ""
  Write-Host "=== $Text ===" -ForegroundColor Cyan
}

function Read-SecretText([string]$Prompt) {
  $secure = Read-Host $Prompt -AsSecureString
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

function Get-ManagementToken {
  if (-not [string]::IsNullOrWhiteSpace($env:SUPABASE_ACCESS_TOKEN)) {
    return $env:SUPABASE_ACCESS_TOKEN.Trim()
  }

  $candidatePaths = New-Object System.Collections.Generic.List[string]
  if (-not [string]::IsNullOrWhiteSpace([string]$HOME)) {
    $candidatePaths.Add((Join-Path $HOME ".supabase/access-token"))
  }
  if (-not [string]::IsNullOrWhiteSpace([string]$env:USERPROFILE)) {
    $candidatePaths.Add((Join-Path $env:USERPROFILE ".supabase/access-token"))
  }

  foreach ($path in ($candidatePaths | Select-Object -Unique)) {
    if (Test-Path -LiteralPath $path) {
      $value = (Get-Content -LiteralPath $path -Raw).Trim()
      if (-not [string]::IsNullOrWhiteSpace($value)) {
        Write-Host "Menggunakan sesi Supabase CLI yang tersimpan di komputer." -ForegroundColor DarkGray
        return $value
      }
    }
  }

  Write-Host "Token Supabase CLI tidak ditemukan pada file lokal." -ForegroundColor Yellow
  Write-Host "Buat Personal Access Token di akun Supabase, lalu masukkan di bawah ini." -ForegroundColor Yellow
  Write-Host "Token tidak akan ditampilkan atau disimpan oleh skrip ini." -ForegroundColor DarkGray
  return (Read-SecretText "Supabase Personal Access Token").Trim()
}

function Get-Template([string]$FileName) {
  $localPath = Join-Path (Join-Path $PSScriptRoot "..\email-templates") $FileName
  if (Test-Path -LiteralPath $localPath) {
    return Get-Content -LiteralPath $localPath -Raw -Encoding UTF8
  }

  $uri = "$TemplateBaseUrl/$FileName"
  Write-Host "Mengunduh template $FileName ..." -ForegroundColor DarkGray
  return (Invoke-WebRequest -Uri $uri -UseBasicParsing).Content
}

function Get-ErrorDetails($ErrorRecord) {
  try {
    $response = $ErrorRecord.Exception.Response
    if ($null -eq $response) { return $ErrorRecord.Exception.Message }

    if ($response.PSObject.Properties.Name -contains "Content") {
      $content = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
      if (-not [string]::IsNullOrWhiteSpace($content)) { return $content }
    }

    if ($response.PSObject.Methods.Name -contains "GetResponseStream") {
      $stream = $response.GetResponseStream()
      if ($null -ne $stream) {
        $reader = New-Object IO.StreamReader($stream)
        try { return $reader.ReadToEnd() }
        finally { $reader.Dispose() }
      }
    }
  }
  catch { }
  return $ErrorRecord.Exception.Message
}

function Get-PropertyValue($Object, [string]$Name) {
  if ($null -eq $Object) { return $null }
  $property = $Object.PSObject.Properties[$Name]
  if ($null -eq $property) { return $null }
  return $property.Value
}

Write-Host ""
Write-Host "Sahabat Familia - Konfigurasi Auth Produksi" -ForegroundColor Blue
Write-Host "Project: $ProjectRef" -ForegroundColor DarkGray
Write-Host "Tidak ada kata sandi atau token yang ditulis ke repository." -ForegroundColor DarkGray

if ($ConfigureSmtp -and $SkipSmtp) {
  throw "Gunakan salah satu: -ConfigureSmtp atau -SkipSmtp."
}

$useSmtp = [bool]$ConfigureSmtp
if (-not $ConfigureSmtp -and -not $SkipSmtp) {
  $answer = (Read-Host "Aktifkan email resmi melalui Resend SMTP sekarang? (Y/N)").Trim()
  $useSmtp = $answer -match '(?i)^(y|ya|yes)$'
}

Write-Section "Memuat template resmi"
$confirmationTemplate = Get-Template "confirmation.html"
$recoveryTemplate = Get-Template "recovery.html"
$magicLinkTemplate = Get-Template "magic-link.html"
$emailChangeTemplate = Get-Template "email-change.html"

$payload = [ordered]@{
  site_url = $ProductionUrl
  uri_allow_list = @(
    "https://www.familiamedika.id/sahabat/",
    "https://www.familiamedika.id/sahabat/**",
    "https://sahabat.familiamedika.id/**"
  ) -join ','
  external_email_enabled = $true
  mailer_autoconfirm = $false
  mailer_secure_email_change_enabled = $true
  password_min_length = 8
  smtp_sender_name = $SenderName
  mailer_subjects_confirmation = "Verifikasi Akun Sahabat Familia"
  mailer_templates_confirmation_content = $confirmationTemplate
  mailer_subjects_recovery = "Atur Ulang Kata Sandi Sahabat Familia"
  mailer_templates_recovery_content = $recoveryTemplate
  mailer_subjects_magic_link = "Tautan Masuk Sahabat Familia"
  mailer_templates_magic_link_content = $magicLinkTemplate
  mailer_subjects_email_change = "Konfirmasi Perubahan Email Sahabat Familia"
  mailer_templates_email_change_content = $emailChangeTemplate
}

$resendApiKey = $null
if ($useSmtp) {
  Write-Section "Konfigurasi Resend SMTP"
  if ([string]::IsNullOrWhiteSpace($SenderEmail) -or $SenderEmail -notmatch '^[^@\s]+@[^@\s]+\.[^@\s]+$') {
    throw "Alamat pengirim tidak valid: $SenderEmail"
  }

  if (-not [string]::IsNullOrWhiteSpace($env:SAHABAT_RESEND_API_KEY)) {
    $resendApiKey = $env:SAHABAT_RESEND_API_KEY.Trim()
  }
  else {
    Write-Host "Masukkan Resend API key untuk domain pengirim yang sudah diverifikasi." -ForegroundColor Yellow
    Write-Host "API key tidak akan ditampilkan atau disimpan oleh skrip ini." -ForegroundColor DarkGray
    $resendApiKey = (Read-SecretText "Resend API key").Trim()
  }

  if ([string]::IsNullOrWhiteSpace($resendApiKey)) {
    throw "Resend API key belum diisi. Jalankan ulang tanpa SMTP atau masukkan API key yang valid."
  }

  $payload["smtp_host"] = "smtp.resend.com"
  $payload["smtp_port"] = "465"
  $payload["smtp_user"] = "resend"
  $payload["smtp_pass"] = $resendApiKey
  $payload["smtp_admin_email"] = $SenderEmail
  $payload["smtp_sender_name"] = $SenderName
}

Write-Section "Otorisasi Supabase"
$managementToken = Get-ManagementToken
if ([string]::IsNullOrWhiteSpace($managementToken)) {
  throw "Supabase Personal Access Token belum tersedia."
}

$headers = @{
  Authorization = "Bearer $managementToken"
  Accept = "application/json"
}

Write-Section "Menerapkan konfigurasi"
try {
  $body = $payload | ConvertTo-Json -Depth 12 -Compress
  $request = @{
    Uri = $ManagementEndpoint
    Method = "Patch"
    Headers = $headers
    ContentType = "application/json; charset=utf-8"
    Body = $body
  }
  $null = Invoke-RestMethod @request
}
catch {
  $details = Get-ErrorDetails $_
  throw "Konfigurasi Supabase Auth gagal diterapkan. $details"
}
finally {
  $body = $null
  $request = $null
  $resendApiKey = $null
}

Write-Section "Verifikasi hasil"
try {
  $verified = Invoke-RestMethod -Uri $ManagementEndpoint -Method Get -Headers $headers
}
catch {
  $details = Get-ErrorDetails $_
  throw "Konfigurasi sudah dikirim, tetapi verifikasi hasil gagal. $details"
}
finally {
  $managementToken = $null
  $headers = $null
}

$remoteRedirects = [string](Get-PropertyValue $verified "uri_allow_list")
$redirectItems = $remoteRedirects.Split(',') | ForEach-Object { $_.Trim() }
$expectedRedirectItems = $payload.uri_allow_list.Split(',') | ForEach-Object { $_.Trim() }
$redirectsComplete = @($expectedRedirectItems | Where-Object { $_ -notin $redirectItems }).Count -eq 0

$checks = [ordered]@{
  "Site URL produksi" = ((Get-PropertyValue $verified "site_url") -eq $ProductionUrl)
  "Redirect Sahabat Familia" = $redirectsComplete
  "Konfirmasi email wajib" = ((Get-PropertyValue $verified "mailer_autoconfirm") -eq $false)
  "Subject verifikasi resmi" = ((Get-PropertyValue $verified "mailer_subjects_confirmation") -eq "Verifikasi Akun Sahabat Familia")
  "Subject reset password resmi" = ((Get-PropertyValue $verified "mailer_subjects_recovery") -eq "Atur Ulang Kata Sandi Sahabat Familia")
  "Nama pengirim resmi" = ((Get-PropertyValue $verified "smtp_sender_name") -eq $SenderName)
  "Minimum password 8 karakter" = ([int](Get-PropertyValue $verified "password_min_length") -eq 8)
}

if ($useSmtp) {
  $checks["Resend SMTP aktif"] = ((Get-PropertyValue $verified "smtp_host") -eq "smtp.resend.com")
  $checks["Email pengirim resmi"] = ((Get-PropertyValue $verified "smtp_admin_email") -eq $SenderEmail)
}

$failed = @()
foreach ($item in $checks.GetEnumerator()) {
  if ($item.Value) {
    Write-Host "[OK] $($item.Key)" -ForegroundColor Green
  }
  else {
    Write-Host "[BELUM] $($item.Key)" -ForegroundColor Red
    $failed += $item.Key
  }
}

Write-Host ""
if ($failed.Count -gt 0) {
  Write-Host "Konfigurasi terkirim, tetapi beberapa hasil belum sesuai:" -ForegroundColor Yellow
  $failed | ForEach-Object { Write-Host "- $_" -ForegroundColor Yellow }
  exit 2
}

Write-Host "Selesai. Email baru akan memakai callback Sahabat Familia dan template berbahasa Indonesia." -ForegroundColor Green
Write-Host "Password baru dan reset password memakai minimum 8 karakter." -ForegroundColor Green
if ($useSmtp) {
  Write-Host "Pengirim resmi aktif: $SenderName <$SenderEmail>" -ForegroundColor Green
}
else {
  Write-Host "Alamat pengirim masih memakai relay Supabase sampai Resend SMTP diaktifkan." -ForegroundColor Yellow
}

exit 0
