#!/bin/sh
# Fetch the recorded instruments and the player that reads them into libs/
# (about 3 GB; libs/ is not in git). Run once, then ./render.sh.
#
#   Salamander Grand Piano V3 (Alexander Holm), CC BY 3.0: the credit
#     "Salamander Grand Piano by Alexander Holm (CC BY 3.0)" must go with
#     the video, e.g. in its description.
#   VSCO 2 Community Edition (Versilian Studios), CC0: no conditions.
#   sfizz (sfztools), BSD 2-Clause: the SFZ player, built here.
#
# Needs git, cmake, ninja, a C++ compiler and libsndfile
# (apt-get install cmake ninja-build g++ libsndfile1-dev); pip install mido numpy scipy.
set -e
cd "$(dirname "$0")"
mkdir -p libs && cd libs

[ -d salamander ] || git clone --depth 1 https://github.com/sfzinstruments/SalamanderGrandPiano salamander

if [ ! -d vsco ]; then
  # only the instruments the score uses (the whole library is much bigger)
  git clone --depth 1 --branch SFZ --filter=blob:none --no-checkout https://github.com/sgossner/VSCO-2-CE vsco
  cd vsco
  git checkout SFZ -- LICENSE '*.sfz' \
    "Brass/F Horn/sus" "Brass/Tenor Trombone/sus" "Brass/Trumpet/stac" "Brass/Trumpet/sus" \
    Percussion "Strings/Harp" "Strings/Solo Contrabass/Pizz" \
    "Strings/Cello Section/spic" "Strings/Cello Section/susvib" "Strings/Cello Section/trem" \
    "Strings/Viola Section/spic" "Strings/Viola Section/susvib" "Strings/Viola Section/trem" \
    "Strings/Violin Section/Spic" "Strings/Violin Section/Trem" "Strings/Violin Section/susVib" \
    "VSCO 1 Percussion/drums/other/Bongos" "VSCO 1 Percussion/varMetal/various" \
    "VSCO 1 Percussion/drums/snare/drum1"
  cd ..
fi

if [ ! -x sfizz/build/library/bin/sfizz_render ]; then
  [ -d sfizz ] || git clone --depth 1 --recursive --shallow-submodules https://github.com/sfztools/sfizz sfizz
  cmake -S sfizz -B sfizz/build -G Ninja -DCMAKE_BUILD_TYPE=Release -DSFIZZ_RENDER=ON \
    -DSFIZZ_JACK=OFF -DSFIZZ_LV2=OFF -DSFIZZ_LV2_UI=OFF -DSFIZZ_VST=OFF -DSFIZZ_AU=OFF \
    -DSFIZZ_PUREDATA=OFF -DSFIZZ_TESTS=OFF -DSFIZZ_BENCHMARKS=OFF -DSFIZZ_DEMOS=OFF -DSFIZZ_DEVTOOLS=OFF
  cmake --build sfizz/build --target sfizz_render
fi
echo "libs ready"
