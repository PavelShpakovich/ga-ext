#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="public/tesseract/core"
TESSDATA_DIR="$OUT_DIR/tessdata"

mkdir -p "$TESSDATA_DIR"

echo "Preparing Tesseract assets in $OUT_DIR"

# -----------------------------
# 1️⃣ Copy matching core from node_modules
# -----------------------------
CORE_SRC="node_modules/tesseract.js-core"

if [ ! -d "$CORE_SRC" ]; then
  echo "tesseract.js-core not found. Installing..."
  npm install tesseract.js-core@latest
fi

echo "Copying core WASM + loader from node_modules"
cp "$CORE_SRC/tesseract-core.wasm.js" "$OUT_DIR/"
cp "$CORE_SRC/tesseract-core.wasm" "$OUT_DIR/"

# -----------------------------
# 2️⃣ Copy worker from installed tesseract.js
# -----------------------------
WORKER_SRC="node_modules/tesseract.js/dist/worker.min.js"

if [ ! -f "$WORKER_SRC" ]; then
  echo "worker.min.js not found. Reinstalling tesseract.js..."
  npm install tesseract.js@latest
fi

echo "Copying worker script"
cp "$WORKER_SRC" "$OUT_DIR/worker.min.js"

# -----------------------------
# 3️⃣ Download language data (not gzipped)
# -----------------------------
LANG="eng"
TESSDATA_URL="https://github.com/tesseract-ocr/tessdata/raw/main/$LANG.traineddata"

echo "Downloading $LANG.traineddata"
curl -L -f -o "$TESSDATA_DIR/$LANG.traineddata" "$TESSDATA_URL"

echo "Done. Final file list:"
ls -lh "$OUT_DIR"
ls -lh "$TESSDATA_DIR"
