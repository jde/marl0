#!/bin/bash

# 📋 Copy Marl0 Project Context to Clipboard
# Clean, maintainable, developer-friendly handoff script.

# ===========
# 🔧 Configurable list of files and directories to include
FILES=(
  "./README.md"
  "./CHANGELOG.md"
)

DIRECTORIES=(
  "./docs"
)

# ===========

# Temporary file to hold output
TEMP_FILE=$(mktemp /tmp/marl0-context.XXXXXX.txt)

echo "📋 Generating clipboard-ready context block..."
echo "🚀 Marl0 Project Context — Handoff Block 🚀" > "$TEMP_FILE"
echo "" >> "$TEMP_FILE"

# 📝 Include files
for FILE in "${FILES[@]}"; do
  if [[ -f "$FILE" ]]; then
    echo "=== Start of $FILE ===" >> "$TEMP_FILE"
    cat "$FILE" >> "$TEMP_FILE"
    echo "" >> "$TEMP_FILE"
    echo "=== End of $FILE ===" >> "$TEMP_FILE"
    echo "" >> "$TEMP_FILE"
  else
    echo "⚠️ Warning: $FILE not found. Skipping."
  fi
done

# 🗂️ Include directories recursively
for DIR in "${DIRECTORIES[@]}"; do
  if [[ -d "$DIR" ]]; then
    echo "📂 Including all files in $DIR recursively..."
    find "$DIR" -type f | while read -r FILE; do
      echo "=== Start of $FILE ===" >> "$TEMP_FILE"
      cat "$FILE" >> "$TEMP_FILE"
      echo "" >> "$TEMP_FILE"
      echo "=== End of $FILE ===" >> "$TEMP_FILE"
      echo "" >> "$TEMP_FILE"
    done
  else
    echo "⚠️ Warning: $DIR directory not found. Skipping."
  fi
done

# ✅ Copy to clipboard (macOS)
pbcopy < "$TEMP_FILE"

# ✅ Cleanup
rm "$TEMP_FILE"

echo "✅ Project context copied to clipboard!"
