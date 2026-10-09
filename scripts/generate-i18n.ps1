param(
  [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
$dist = Join-Path $ProjectRoot 'dist'
$indexPath = Join-Path $dist 'index.html'
$sourcePaths = @(
  $indexPath,
  (Join-Path $dist 'assets\textbook.js'),
  (Join-Path $dist 'assets\course-hub.js')
)

$phrases = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
function Add-Phrase([string]$value) {
  if ([string]::IsNullOrWhiteSpace($value)) { return }
  $clean = [System.Net.WebUtility]::HtmlDecode(($value -replace '\s+', ' ').Trim())
  if ($clean.Length -gt 520 -or $clean -notmatch '[\p{IsCJKUnifiedIdeographs}]') { return }
  if ($clean -match '\$\{|^(const|let|function|return|if|for)\b') { return }
  [void]$phrases.Add($clean)
}

$html = Get-Content -LiteralPath $indexPath -Raw -Encoding UTF8
$htmlOnly = [regex]::Replace($html, '(?is)<script\b.*?</script>|<style\b.*?</style>', '')
[regex]::Matches($htmlOnly, '>([^<>]*[\p{IsCJKUnifiedIdeographs}][^<>]*)<') | ForEach-Object { Add-Phrase $_.Groups[1].Value }
[regex]::Matches($htmlOnly, '(?:alt|title|aria-label|placeholder)=["'']([^"'']*[\p{IsCJKUnifiedIdeographs}][^"'']*)["'']') | ForEach-Object { Add-Phrase $_.Groups[1].Value }

foreach ($path in $sourcePaths) {
  $source = Get-Content -LiteralPath $path -Raw -Encoding UTF8
  [regex]::Matches($source, '(["''])([^"''\r\n]*[\p{IsCJKUnifiedIdeographs}][^"''\r\n]*)\1') | ForEach-Object { Add-Phrase $_.Groups[2].Value }
}

@(
  '第 1 题','第 2 题','第 3 题','第 4 题','第 5 题','已恢复这道题的本机记录。','已保存在当前浏览器。','本题为空，未保存。','已清空本机出门票记录。',
  '学习进度','语言选择','主导航','题目进度','问题进度','播放位相变化','热带太平洋 EOF 空间模态教学示意图','EOF 主成分时间序列教学示意图',
  '点击查看原图 ↗','展开读图重点','与你的研究：'
) | ForEach-Object { Add-Phrase $_ }

$ordered = @($phrases | Sort-Object)
$translations = [ordered]@{}
$separator = '[[[SPLIT]]]'
for ($offset = 0; $offset -lt $ordered.Count; $offset += 14) {
  $last = [Math]::Min($offset + 13, $ordered.Count - 1)
  $chunk = @($ordered[$offset..$last])
  $query = [uri]::EscapeDataString(($chunk -join "`n$separator`n"))
  $uri = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q=$query"
  $response = Invoke-RestMethod -Uri $uri -Method Get
  $translated = (($response[0] | ForEach-Object { $_[0] }) -join '') -split [regex]::Escape("`n$separator`n")
  if ($translated.Count -ne $chunk.Count) {
    $translated = (($response[0] | ForEach-Object { $_[0] }) -join '') -split [regex]::Escape($separator)
  }
  if ($translated.Count -ne $chunk.Count) { throw "Translation split mismatch at offset $offset" }
  for ($i = 0; $i -lt $chunk.Count; $i++) {
    $translations[$chunk[$i]] = ($translated[$i] -replace '^\s+|\s+$', '')
  }
}

$overrides = [ordered]@{
  '描述性物理海洋' = 'Descriptive Physical Oceanography'
  '描述性物理海洋 · 课程网站' = 'Descriptive Physical Oceanography · Course Site'
  '我的知识外脑' = 'My External Knowledge Brain'
  '课程网站 · 我的知识外脑' = 'Course Site · My External Knowledge Brain'
  '出门票' = 'Exit Ticket'
  '沿岸俘获波' = 'Coastally Trapped Waves'
  '位温' = 'Potential Temperature'
  '位密度' = 'Potential Density'
  '经验正交函数' = 'Empirical Orthogonal Function'
  'EOF 经验正交分解' = 'EOF Decomposition'
  '海表温度' = 'Sea Surface Temperature'
  '方差贡献' = 'Explained Variance'
  'EOF 可视实验' = 'EOF Visual Lab'
  '点击查看原图 ↗' = 'View original figure ↗'
  '展开读图重点' = 'Expand reading notes'
  '与你的研究：' = 'Link to your research:'
  '我的知识外脑 · 学习材料仅用于课程与研究交流' = 'My External Knowledge Brain · Learning materials for coursework and research exchange'
  '为什么比较不同深度水团时，原位温度往往不如位温合适？' = 'Why is potential temperature usually more suitable than in-situ temperature when comparing water masses at different depths?'
  '位温把水团绝热移到统一参考压力，便于比较热力状态。' = 'Potential temperature moves each parcel adiabatically to a common reference pressure, making thermodynamic states comparable.'
  '中' = '中'
}
foreach ($key in $overrides.Keys) { $translations[$key] = $overrides[$key] }

$json = $translations | ConvertTo-Json -Depth 4 -Compress
$outputPath = Join-Path $dist 'assets\i18n-translations.js'
[System.IO.File]::WriteAllText($outputPath, "window.DPO_I18N=$json;`n", [System.Text.UTF8Encoding]::new($false))
Write-Output "Generated $($translations.Count) translations: $outputPath"
