# Minification Guide

## HTML

Install:

```bash
pip install minify-html
```

Minify:

```bash
python3 -c "
import minify_html;
print(
    minify_html.minify(
        open('index.unminified.html').read(),
        minify_js=True,
        minify_css=True,
        keep_closing_tags=True,
        remove_processing_instructions=True
    )
)" > index.html
```

---

## CSS

Install:

```bash
npm install -g clean-css-cli
```

Minify:

```bash
cleancss \
/path/to/file/assets/css/unminified/styles.css \
-o /path/to/file/assets/css/styles.min.css
```

---

## JavaScript

Install:

```bash
npm install -g terser
```

Minify:

```bash
terser \
/path/to/file/assets/js/unminified/main.js \
-o /path/to/file/assets/js/main.min.js \
-c -m
```
