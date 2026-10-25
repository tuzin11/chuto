$ErrorActionPreference = 'Stop'
$siteRoot = $PSScriptRoot
$publishRoot = Join-Path $siteRoot 'github-pages'
$assetNames = @('style.css', 'dictionary.js', 'game.js')
$htmlPath = Join-Path $siteRoot 'index.html'
$html = [IO.File]::ReadAllText($htmlPath)
foreach ($asset in $assetNames) {
  $hash = (Get-FileHash -LiteralPath (Join-Path $siteRoot $asset) -Algorithm SHA256).Hash.Substring(0, 12).ToLowerInvariant()
  $pattern = '((?:src|href)=")' + [regex]::Escape($asset) + '(?:\?[^"\s]*)?(")'
  $html = [regex]::Replace($html, $pattern, '${1}' + $asset + '?v=' + $hash + '${2}')
}
$utf8 = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText($htmlPath, $html, $utf8)
New-Item -ItemType Directory -Path $publishRoot -Force | Out-Null
$files = @('index.html', 'style.css', 'dictionary.js', 'game.js', 'favicon.svg', 'dicionario-LICENSE.txt', 'dicionario-fserb-LICENSE.txt', 'dicionario-vero-LICENSE.txt')
foreach ($file in $files) {
  Copy-Item -LiteralPath (Join-Path $siteRoot $file) -Destination (Join-Path $publishRoot $file) -Force
}
[IO.File]::WriteAllText((Join-Path $publishRoot '.nojekyll'), '', $utf8)
$archiveFiles = @($files | ForEach-Object { Join-Path $publishRoot $_ })
$archiveFiles += Join-Path $publishRoot '.nojekyll'
Compress-Archive -LiteralPath $archiveFiles -DestinationPath (Join-Path $siteRoot 'cinco-site.zip') -Force
Write-Output 'Versao atual preparada em github-pages/ e cinco-site.zip.'
