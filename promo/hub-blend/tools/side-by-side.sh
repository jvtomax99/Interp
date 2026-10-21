#!/usr/bin/env bash
# v11 (left) beside the 3D remake (right), shot by shot, each pair as long as the longer of
# the two (the shorter holds its last frame). Sound: the remake's, per shot.
#   bash promo/hub-blend/tools/side-by-side.sh <v11.mp4> <remake.mp4> <out.mp4>
set -euo pipefail
V11=$1; REM=$2; OUT=$3
TMP=$(mktemp -d)
FONT=$(fc-match -f '%{file}' 'DejaVu Sans:bold' 2>/dev/null || true)
# name  v11-start v11-end  remake-start remake-end   ("-" = not in v11)
SEGS="Walk-in - - 0 2.5
Hook 0 8 2.5 10
Logo 8 10 10 12
Home 10 13 12 14.5
Glossary 13 16 14.5 17
3D-Body - - 17 20.5
Translate 16 19 20.5 23
Doctor-Prep 19 22 23 25.5
False-Friends 22 25 25.5 28
Daily-Drill 25 28 28 30.5
CoreCHI 28 31 30.5 33.5
Team-Chat 31 34 33.5 36
Ask 34 37 36 38.5
End 37 45 38.5 43"
i=0; LIST=$TMP/list.txt; : > "$LIST"
while read -r name a b c d; do
  rl=$(echo "$d - $c" | bc); vl=0; [ "$a" != "-" ] && vl=$(echo "$b - $a" | bc)
  len=$(echo "if ($rl > $vl) $rl else $vl" | bc)
  label="drawtext=fontfile=$FONT:fontsize=26:fontcolor=white:box=1:boxcolor=0x03061a@0.7:boxborderw=8:x=14:y=h-50"
  if [ "$a" = "-" ]; then
    left="color=c=0x03061a:s=540x960:d=$len:r=30,drawtext=fontfile=$FONT:fontsize=30:fontcolor=0x98A1B3:text='Not in v11':x=(w-tw)/2:y=(h-th)/2,$label:text='v11'"
    LIN=(-f lavfi -i "$left")
  else
    LIN=(-ss "$a" -t "$vl" -i "$V11")
  fi
  seg=$TMP/$(printf %02d $i).mp4
  if [ "$a" = "-" ]; then
    ffmpeg -nostdin -v error -y "${LIN[@]}" -ss "$c" -t "$rl" -i "$REM" -filter_complex \
      "[0:v]setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=$len,trim=0:$len[l];[1:v]scale=540:960,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=$len,trim=0:$len,$label:text='3D remake  ·  ${name//-/ }'[r];[l][r]hstack[v];[1:a]apad,atrim=0:$len[a]" \
      -map "[v]" -map "[a]" -r 30 -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a aac "$seg"
  else
    ffmpeg -nostdin -v error -y "${LIN[@]}" -ss "$c" -t "$rl" -i "$REM" -filter_complex \
      "[0:v]scale=540:960,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=$len,trim=0:$len,$label:text='v11'[l];[1:v]scale=540:960,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=$len,trim=0:$len,$label:text='3D remake  ·  ${name//-/ }'[r];[l][r]hstack[v];[1:a]apad,atrim=0:$len[a]" \
      -map "[v]" -map "[a]" -r 30 -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a aac "$seg"
  fi
  echo "file '$seg'" >> "$LIST"; i=$((i + 1))
done <<< "$SEGS"
ffmpeg -nostdin -v error -y -f concat -safe 0 -i "$LIST" -c copy "$OUT"
rm -r "$TMP"
echo "$OUT"
