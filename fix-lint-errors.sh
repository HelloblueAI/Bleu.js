#!/bin/bash

# List of files to fix
FILES=(
  "backend/tests/apiGenerateEgg.test.js"
  "backend/tests/seedDatabase.test.js"
  "backend/tests/CustomSequencer.js"
  "backend/controllers/apiController.js"
  "backend/controllers/dataController.js"
  "backend/controllers/rulesController.js"
  "backend/ml/modelManager.js"
  "backend/models/AiQuery.js"
  "backend/models/ruleModel.js"
  "backend/models/userModel.js"
  "backend/routes/apiRoutes.js"
  "backend/routes/dataRoutes.js"
  "backend/routes/simpleRoute.js"
  "backend/services/aiService.js"
  "backend/services/decisionTreeService.js"
  "backend/services/ruleService.js"
  "backend/services/rulesEngine.js"
  "backend/src/routes.js"
  "backend/src/swagger.js"
  "backend/tests/aiService.test.js"
  "backend/tests/aiTests.test.js"
  "backend/tests/apiController.test.js"
  "backend/tests/apiRoutes.test.js"
  "backend/tests/bleu.test.js"
  "backend/tests/decisionTree.test.js"
  "eggs-generator/src/HenFarm.js"
  "eggs-generator/src/generateEgg.js"
  "eggs-generator/src/Bleu.js"
  "eggs-generator/tests/example.test.js"
  "frontend/src/index.js"
  "frontend/src/App.vue"
)

for FILE in "${FILES[@]}"; do
  echo "Fixing $FILE..."
  pnpm eslint "$FILE" --fix
  pnpm prettier --write "$FILE"
  pnpm jest "$FILE"
done

echo "Running the full test suite..."
pnpm jest

