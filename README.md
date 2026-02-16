# Equinox Dashboard - Desktop Application

A cross-platform desktop application for managing action items, built with Electron, React, and Node.js.

## For End Users

### Installation

1. Download the installer for your platform:
   - **Windows**: `Equinox-Dashboard-Setup-1.0.0.exe`
   - **macOS**: `Equinox-Dashboard-1.0.0.dmg`
   - **Linux**: `Equinox-Dashboard-1.0.0.AppImage`

2. Run the installer and follow the prompts

3. Launch "Equinox Dashboard" from your applications menu

### Default Login

On first launch, use these credentials:
- **Email**: admin@equinox.com
- **Password**: admin123

## For Developers

### Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development servers:
   - Terminal 1: `cd server && npm run dev`
   - Terminal 2: `cd client && npm run dev`
   - Terminal 3: `npm run electron:dev`

### Building Installers

Build for all platforms:
```bash
npm run electron:build:all
```

Build for specific platform:
```bash
npm run electron:build:win    # Windows
npm run electron:build:mac    # macOS
npm run electron:build:linux  # Linux
```

Installers will be created in the `dist/` directory.

### Project Structure

```
equinox-dashboard/
├── electron/           # Electron main process
├── client/            # React frontend (Vite)
├── server/            # Express backend with Prisma
├── build/             # Icon and installer assets
└── dist/              # Built installers (gitignored)
```

### Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4
- **Backend**: Node.js, Express, Prisma
- **Database**: SQLite (embedded)
- **Desktop**: Electron

## License

ISC
