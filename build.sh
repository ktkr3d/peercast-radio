#!/bin/sh -f

x=$(pwd)
x=${x##*/}
rm -f $x.xpi
timestamp=`date +%Y%m%d_%H%M%S`

# chrome のアーカイブ（無圧縮）
# archive chrome (non-compressed)
mkdir -p build/chrome
cd chrome
find . ! -name '.*' -exec zip -0 ../build/chrome/$x.jar {} \;
cd ..

cp -rf chrome.manifest install.rdf defaults build

# 全体のアーカイブ（圧縮）
# archive whole (compressed)
cd build
find . ! -name . -exec zip -9 ../$x.xpi {} \;
cd ..

mv ./$x.xpi ./pr_$timestamp.xpi

rm -rf build
