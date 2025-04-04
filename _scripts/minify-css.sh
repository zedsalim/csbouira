#!/bin/bash

CSS_DIR="assets/css"

for file in "$CSS_DIR"/*.css; do
  if [[ "$file" == *.min.css ]]; then
    continue
  fi

  out="${file%.css}.min.css"

  cleancss -o "$out" "$file"
  echo "Minified $file -> $out"

  filename=$(basename "$file")
  minified_filename=$(basename "$out")

  find . -type f -name "*.html" -exec sed -i "s|/css/$filename|/css/$minified_filename|g" {} +
  echo "Updated HTML references for $filename to $minified_filename"
done
