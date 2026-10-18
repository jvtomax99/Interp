#!/bin/bash
# Cloud sessions only: install Tesseract by Mirage (video editing and motion
# graphics for Claude). Everything goes in the home folder, nothing in the repo.
# Pinned to what was read and checked on 2026-10-17: skills at commit
# TSR_COMMIT, CLI TSR_VERSION with the zip's exact checksum. A changed upstream
# file fails the checksum and nothing is installed. To upgrade, read the new
# release, then change the three pins together.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

TSR_COMMIT=16c887b3c59a22b966c81fb48356402a673bb90a
TSR_VERSION=0.4.0
TSR_SHA256=1281d1b7003ec632f8ed3054ee8db8501dcc66d4d650a2b47ba2d2f9da817e53

data="${XDG_DATA_HOME:-$HOME/.local/share}/Tesseract"
tsrct="$data/bin/tsrct"
skills="$HOME/.claude/skills"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

# Skills: the four instruction folders, at the pinned commit.
if [ "$(cat "$skills/tesseract-video/.commit" 2>/dev/null)" != "$TSR_COMMIT" ]; then
  git init -q "$work/repo"
  git -C "$work/repo" fetch -q --depth 1 https://github.com/mirage-hq/Tesseract "$TSR_COMMIT"
  git -C "$work/repo" checkout -q FETCH_HEAD
  mkdir -p "$skills"
  for d in "$work"/repo/skills/*/; do
    name=$(basename "$d")
    rm -rf "${skills:?}/$name"
    cp -r "$d" "$skills/$name"
    echo "$TSR_COMMIT" > "$skills/$name/.commit"
  done
fi

# CLI: the pinned release, checked against the pinned checksum before install.
if ! "$tsrct" --version 2>/dev/null | grep -q "$TSR_VERSION"; then
  zip="tesseract-$TSR_VERSION-linux-x86_64.zip"
  curl -fsSL -o "$work/$zip" \
    "https://github.com/mirage-hq/tesseract/releases/download/v$TSR_VERSION/$zip"
  echo "$TSR_SHA256  $work/$zip" | sha256sum -c --quiet
  unzip -q "$work/$zip" -d "$work/cli"
  bash "$work/cli/tesseract-$TSR_VERSION-linux-x86_64/install.sh" >/dev/null
fi

# Rendering needs a Vulkan driver; the container has none, so add Mesa's
# software one (lavapipe).
if ! ls /usr/share/vulkan/icd.d/lvp_icd*.json >/dev/null 2>&1; then
  apt-get update -qq >/dev/null
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq mesa-vulkan-drivers >/dev/null
fi

# Usage reporting is on by default in releases; keep it off.
"$tsrct" telemetry disable >/dev/null

if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export PATH=\"$data/bin:\$PATH\"" >> "$CLAUDE_ENV_FILE"
fi
