#!/bin/bash

# Equinox Dashboard - Build Verification Script
# This script verifies that all platform installers were built successfully

echo "🔍 Equinox Dashboard - Build Verification"
echo "=========================================="
echo ""

DIST_DIR="./dist"

# Check if dist directory exists
if [ ! -d "$DIST_DIR" ]; then
    echo "❌ Error: dist/ directory not found"
    exit 1
fi

echo "📦 Checking for platform installers..."
echo ""

# Check Windows
WINDOWS_EXE=$(find "$DIST_DIR" -name "*.exe" -type f | head -n 1)
if [ -n "$WINDOWS_EXE" ]; then
    SIZE=$(du -h "$WINDOWS_EXE" | cut -f1)
    echo "✅ Windows: $(basename "$WINDOWS_EXE") ($SIZE)"
else
    echo "❌ Windows installer not found"
fi

# Check macOS
MACOS_DMG=$(find "$DIST_DIR" -name "*.dmg" -type f | head -n 1)
if [ -n "$MACOS_DMG" ]; then
    SIZE=$(du -h "$MACOS_DMG" | cut -f1)
    echo "✅ macOS: $(basename "$MACOS_DMG") ($SIZE)"
else
    echo "⚠️  macOS installer not found (may need to build with: npm run electron:build:mac)"
fi

# Check Linux
LINUX_APPIMAGE=$(find "$DIST_DIR" -name "*.AppImage" -type f | head -n 1)
if [ -n "$LINUX_APPIMAGE" ]; then
    SIZE=$(du -h "$LINUX_APPIMAGE" | cut -f1)
    echo "✅ Linux: $(basename "$LINUX_APPIMAGE") ($SIZE)"
else
    echo "⚠️  Linux installer not found (may need to build with: npm run electron:build:linux)"
fi

echo ""
echo "📊 Build Summary"
echo "================"
echo "Total installers: $(find "$DIST_DIR" -name "*.exe" -o -name "*.dmg" -o -name "*.AppImage" | wc -l | tr -d ' ')"
echo "Total size: $(du -sh "$DIST_DIR" | cut -f1)"
echo ""
echo "✨ Ready for distribution!"
