#!/bin/bash
# Monitor Bleu OS production Docker build progress

LOG_FILE="/tmp/bleu-os-production-build.log"
TERMINAL_LOG="$HOME/.cursor/projects/home-pejmanhaghighatnia-Documents-Bleu-js/terminals/311051.txt"

echo "🔨 Monitoring Bleu OS Production Build..."
echo "=========================================="
echo ""

while true; do
    if [ -f "$TERMINAL_LOG" ]; then
        CURRENT_STEP=$(tail -5 "$TERMINAL_LOG" 2>/dev/null | grep -E "Step [0-9]+/[0-9]+" | tail -1)
        CURRENT_ACTION=$(tail -10 "$TERMINAL_LOG" 2>/dev/null | grep -E "(Collecting|Installing|Building|Downloading)" | tail -1)

        if [ -n "$CURRENT_STEP" ]; then
            echo "[$(date +'%H:%M:%S')] $CURRENT_STEP"
        fi
        if [ -n "$CURRENT_ACTION" ]; then
            echo "  → $CURRENT_ACTION"
        fi

        # Check if build completed
        if grep -q "Successfully built\|Successfully tagged" "$TERMINAL_LOG" 2>/dev/null; then
            echo ""
            echo "✅ Build completed successfully!"
            docker images | grep "bleuos/bleu-os.*production"
            break
        fi

        # Check if build failed
        if grep -q "ERROR\|failed\|non-zero code" "$TERMINAL_LOG" 2>/dev/null | tail -1 | grep -q "ERROR"; then
            echo ""
            echo "❌ Build failed. Check logs:"
            tail -20 "$TERMINAL_LOG"
            break
        fi
    fi

    sleep 30
done
