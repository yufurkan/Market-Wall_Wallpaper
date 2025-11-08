@echo off
echo 'image-list.json' olusturuluyor...

powershell -NoProfile -ExecutionPolicy Bypass -Command "$morning = Get-ChildItem -Path 'files' -Filter '*.*' | Where-Object { ($_.Name -like '*-M*') -and ($_.Extension -in '.jpg','.png','.jpeg') } | ForEach-Object { 'files/' + $_.Name }; $night = Get-ChildItem -Path 'files' -Filter '*.*' | Where-Object { ($_.Name -like '*-N*') -and ($_.Extension -in '.jpg','.png','.jpeg') } | ForEach-Object { 'files/' + $_.Name }; @{ morningImages = [array]$morning; nightImages = [array]$night } | ConvertTo-Json -Depth 3" > image-list.json

echo 'image-list.json' basariyla olusturuldu!
echo Lutfen 'image-list.json' dosyasini kontrol edin.
pause