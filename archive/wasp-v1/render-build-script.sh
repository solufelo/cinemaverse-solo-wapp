#!/bin/bash
set -e

echo "🚀 Installing Wasp CLI..."
curl -sSL https://get.wasp.sh/installer.sh | sh -s -- -v 0.16.0

echo "🔍 Finding Wasp installation..."
# Try common locations
WASP_PATHS=(
    "$HOME/.wasp/bin"
    "/opt/render/.local/bin"
    "$HOME/.local/bin"
    "/usr/local/bin"
)

WASP_PATH=""
for path in "${WASP_PATHS[@]}"; do
    if [ -f "$path/wasp" ]; then
        WASP_PATH="$path"
        break
    fi
done

if [ -z "$WASP_PATH" ]; then
    echo "❌ Could not find wasp binary"
    find /opt /home -name "wasp" -type f 2>/dev/null | head -5
    exit 1
fi

echo "✅ Found wasp at: $WASP_PATH/wasp"

echo "🔨 Building Wasp application..."
export PATH="$WASP_PATH:$PATH"
wasp build

echo "📦 Installing server dependencies inside .wasp/build/server..."
npm --prefix .wasp/build/server install --omit=dev

echo "✅ Build completed successfully!"
