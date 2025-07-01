#!/bin/bash

mkdir -p prompt-lab/repos

while read repo_url; do
  repo_name=$(basename "$repo_url" .git)
  git clone --depth=1 "$repo_url" "prompt-lab/repos/$repo_name"
done < jailbreak_sources.txt