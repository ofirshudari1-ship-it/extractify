Add-Type -AssemblyName System.Drawing

$sizes = @(128, 48, 32, 16)
$outDir = Join-Path $PSScriptRoot "extension\icons"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Draw-Icon([int]$size, [string]$path) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    # Background: rounded square, indigo -> violet diagonal gradient
    $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
    $colorA = [System.Drawing.Color]::FromArgb(255, 79, 70, 229)   # #4F46E5 indigo
    $colorB = [System.Drawing.Color]::FromArgb(255, 124, 58, 237)  # #7C3AED violet
    $gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $colorA, $colorB, 45)

    $radius = [Math]::Max(2, [int]($size * 0.22))
    $path2 = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $path2.AddArc(0, 0, $d, $d, 180, 90)
    $path2.AddArc($size - $d, 0, $d, $d, 270, 90)
    $path2.AddArc($size - $d, $size - $d, $d, $d, 0, 90)
    $path2.AddArc(0, $size - $d, $d, $d, 90, 90)
    $path2.CloseFigure()
    $g.FillPath($gradBrush, $path2)

    # White viewfinder corner brackets (screen-capture motif)
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, [Math]::Max(1.0, $size * 0.045))
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $m = $size * 0.16   # margin
    $armLen = $size * 0.16

    # top-left
    $g.DrawLines($pen, @(
        (New-Object System.Drawing.PointF ($m + $armLen), $m),
        (New-Object System.Drawing.PointF $m, $m),
        (New-Object System.Drawing.PointF $m, ($m + $armLen))
    ))
    # top-right
    $g.DrawLines($pen, @(
        (New-Object System.Drawing.PointF ($size - $m - $armLen), $m),
        (New-Object System.Drawing.PointF ($size - $m), $m),
        (New-Object System.Drawing.PointF ($size - $m), ($m + $armLen))
    ))
    # bottom-left
    $g.DrawLines($pen, @(
        (New-Object System.Drawing.PointF $m, ($size - $m - $armLen)),
        (New-Object System.Drawing.PointF $m, ($size - $m)),
        (New-Object System.Drawing.PointF ($m + $armLen), ($size - $m))
    ))
    # bottom-right
    $g.DrawLines($pen, @(
        (New-Object System.Drawing.PointF ($size - $m - $armLen), ($size - $m)),
        (New-Object System.Drawing.PointF ($size - $m), ($size - $m)),
        (New-Object System.Drawing.PointF ($size - $m), ($size - $m - $armLen))
    ))

    # Center: mini table/grid (2 columns x 2 rows) in white, semi-solid
    $gridBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $gridPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 79, 70, 229), [Math]::Max(1.0, $size * 0.02))
    $gm = $size * 0.34
    $gs = $size - 2 * $gm
    $gridRectPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $gridRadius = [Math]::Max(1, $size * 0.03)
    $gd = $gridRadius * 2
    $gridRectPath.AddArc($gm, $gm, $gd, $gd, 180, 90)
    $gridRectPath.AddArc($gm + $gs - $gd, $gm, $gd, $gd, 270, 90)
    $gridRectPath.AddArc($gm + $gs - $gd, $gm + $gs - $gd, $gd, $gd, 0, 90)
    $gridRectPath.AddArc($gm, $gm + $gs - $gd, $gd, $gd, 90, 90)
    $gridRectPath.CloseFigure()
    $g.FillPath($gridBrush, $gridRectPath)
    $g.DrawPath($gridPen, $gridRectPath)
    # divider lines
    $g.DrawLine($gridPen, $gm, ($gm + $gs / 2), ($gm + $gs), ($gm + $gs / 2))
    $g.DrawLine($gridPen, ($gm + $gs / 2), $gm, ($gm + $gs / 2), ($gm + $gs))

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

foreach ($s in $sizes) {
    $out = Join-Path $outDir "icon$s.png"
    Draw-Icon -size $s -path $out
    Write-Host "Wrote $out"
}
