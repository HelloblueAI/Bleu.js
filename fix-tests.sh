#!/bin/bash

# List of files to fix
FILES=(
  "backend/tests/apiGenerateEgg.test.js"
  "eggs-generator/tests/example.test.js"
  "backend/tests/CustomSequencer.js"
  "backend/tests/seedDatabase.test.js"
)

# Loop through files and fix them
for FILE in "${FILES[@]}"; do
  echo "Processing $FILE..."
  
  # Run Prettier
  pnpm prettier --write "$FILE"
  
  # Fix ESLint issues
  pnpm eslint "$FILE" --fix
  
  # Run Jest for the file
  pnpm jest "$FILE"
done

# Run the full test suite
echo "Running the full test suite..."
pnpm jest

