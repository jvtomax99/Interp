#!/bin/sh
# Score -> audio -> the promo video with its new soundtrack. Needs python3
# with mido, numpy and scipy, ffmpeg, and the instrument libraries and
# their player, fetched once by ./fetch-libs.sh into libs/ (not in git).
# Writes out/built-here.wav and out/hub-promo-ost.mp4. media/ is untouched;
# copy the video there by hand once it's approved.
set -e
cd "$(dirname "$0")"
export SFIZZ_RENDER=${SFIZZ_RENDER:-$PWD/libs/sfizz/build/library/bin/sfizz_render}
python3 score.py
python3 instruments.py   # the recorded instruments, mixed in a room -> out/raw.wav
python3 synth.py   # the sub, risers, impacts and cuts -> out/mix.wav
# 45.1 s like the video's audio, a fade on the last 1.3 s
# A gentle compressor to pack it like the reference, one gain for the whole
# track to -14 LUFS (a plain loudnorm would flatten the quiet intro into the
# loud ending), then a limiter for the peaks. The highpass takes out only
# rumble below the sub (its lowest note is G1, 49 Hz).
ffmpeg -v error -y -i out/mix.wav -af "apad=whole_dur=45.1,atrim=0:45.1,afade=t=out:st=43.8:d=1.3,highpass=f=32,highpass=f=32,equalizer=f=300:t=o:w=1:g=-2.5,highshelf=f=3000:g=2.5,acompressor=threshold=0.125:ratio=2.5:attack=8:release=120" -ar 48000 out/packed.wav
LOUD=$(ffmpeg -i out/packed.wav -af ebur128 -f null - 2>&1 | grep -A1 'Integrated' | grep -o -- '-\?[0-9.]* LUFS' | head -1 | cut -d' ' -f1)
GAIN=$(python3 -c "print(-14 - ($LOUD))")
ffmpeg -v error -y -i out/packed.wav -af "volume=${GAIN}dB,alimiter=limit=0.84:level=false" -ar 48000 out/built-here.wav
ffmpeg -v error -y -i ../../media/hub-promo.mp4 -i out/built-here.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 160k -movflags +faststart out/hub-promo-ost.mp4
echo "out/built-here.wav, out/hub-promo-ost.mp4"
