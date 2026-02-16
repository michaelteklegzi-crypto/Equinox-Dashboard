# Blank Page Troubleshooting Guide

## Issue
The macOS packaged app shows a blank page when opened on other computers.

## Latest Fix (Just Rebuilt)
**New DMG created:** February 12, 2026 at 18:16
**File:** `dist/Equinox Dashboard-1.0.0-arm64.dmg` (96 MB)

##Steps to Test the New Build

### 1. UninstallOld Version (Important!)
```bash
# Remove the old app
rm -rf "/Applications/Equinox Dashboard.app"

# Clear app data (optional, but recommended for clean test)
rm -rf ~/Library/Application\ Support/equinox-dashboard
```

### 2. Install New Version
1. Open the new DMG file from `dist/Equinox Dashboard-1.0.0-arm64.dmg`
2. Drag "Equinox Dashboard" to Applications
3. Launch from Applications folder

### 3. Check Console Logs
If the app still shows a blank page, check the logs:

```bash
# Run the app from Terminal to see logs
/Applications/Equinox\ Dashboard.app/Contents/MacOS/Equinox\ Dashboard
```

Look for these messages:
- ✅ "Environment: Production"
- ✅ "Client path: file://..."
- ✅ "Server started successfully"
- ✅ "Loading client from: ..."
- ✅ "Content loaded successfully"

### 4. Common Issues

#### Issue: "Server process error"
**Solution:** The Node.js server failed to start. Check if port 3000 is available.

#### Issue: "Failed to load: -6"
**Solution:** File not found error. The client files may not be bundled correctly.

#### Issue: Blank page but no errors
**Solution:** The server might be taking too long to start. Wait 5-10 seconds.

## What Changed in This Build

1. **URL Formatting:** Fixed client path resolution using `url.format()`
2. **Error Logging:** Added comprehensive console logging
3. **PDF Export:** New feature included (may increase load time slightly)

## Alternative: Run in Development Mode

If the packaged app still doesn't work, you can run in development mode:

```bash
cd "/Users/michaelteklegzi/Documents/Equinox /Dash board"

# Terminal 1 - Server
cd server && npm run dev

# Terminal 2 - Client  
cd client && npm run dev

# Terminal 3 - Electron
npm run electron:dev
```

This will help identify if the issue is specific to the packaging.

## Next Steps if Still Failing

1. **Check the logs** from Terminal (step 3 above)
2. **Share the error messages** with me
3. We can add even more debugging or try a different approach

## Technical Details

The app loads in this sequence:
1. Electron starts
2. Server forks as child process (2-3 seconds)
3. Client HTML loads from bundled files
4. React app initializes
5. Login page appears

If any step fails, you'll see it in the console logs.
