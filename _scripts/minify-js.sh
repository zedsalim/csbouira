#!/bin/bash

JS_DIR="assets/js"

for file in "$JS_DIR"/*.js; do
  if [[ "$file" == *.min.js ]]; then
    continue
  fi

  out="${file%.js}.min.js"

  uglifyjs "$file" -o "$out" -c -m
  echo "Minified $file -> $out"

  filename=$(basename "$file")
  minified_filename=$(basename "$out")

  find . -type f -name "*.html" -exec sed -i "s|/js/$filename|/js/$minified_filename|g" {} +
  echo "Updated HTML references for $filename to $minified_filename"
done
