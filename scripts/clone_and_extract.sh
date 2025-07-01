#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="prompt-lab/repos"
MANIFEST="jailbreak_sources.txt"
LOG_FILE="prompt-lab/clone.log"

mkdir -p "$REPO_DIR"
: > "$LOG_FILE"

while IFS= read -r url; do
  [[ -z "$url" || "$url" =~ ^# ]] && continue
  repo_name=$(basename "$url" .git)
  target="$REPO_DIR/$repo_name"
  if [ -d "$target" ]; then
    echo "$(date +'%F %T') [SKIP] $url already cloned" | tee -a "$LOG_FILE"
    continue
  fi
  echo "$(date +'%F %T') [CLONE] $url" | tee -a "$LOG_FILE"
  if git clone --depth=1 "$url" "$target" >>"$LOG_FILE" 2>&1; then
    echo "$(date +'%F %T') [OK] $url" | tee -a "$LOG_FILE"
  else
    echo "$(date +'%F %T') [FAIL] $url" | tee -a "$LOG_FILE"
  fi
  echo | tee -a "$LOG_FILE"
done < "$MANIFEST"
