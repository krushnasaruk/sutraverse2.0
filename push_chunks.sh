#!/bin/bash
git reset
count=0
batch=0
files=()

for file in public/uploads/*; do
  if [ -f "$file" ]; then
    # skip the 128MB file
    if [[ "$file" == *"BXE Unit 1 notes.pdf"* ]]; then
      continue
    fi

    files+=("$file")
    count=$((count+1))

    # Commit every 15 files
    if [ $((count % 15)) -eq 0 ]; then
      batch=$((batch+1))
      git add -f "${files[@]}"
      git commit -m "Add uploaded files from cPanel (Batch $batch)"
      echo "Pushing Batch $batch..."
      git push
      files=()
    fi
  fi
done

# Push remaining files
if [ ${#files[@]} -gt 0 ]; then
  batch=$((batch+1))
  git add -f "${files[@]}"
  git commit -m "Add uploaded files from cPanel (Batch $batch)"
  echo "Pushing Batch $batch..."
  git push
fi

echo "All batches pushed successfully!"
