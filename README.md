# Grammar Assistant

Privacy-first AI-powered grammar correction Chrome extension.

## Development

### Install Dependencies

```bash
npm install
```

### Build for Development

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder

## Project Structure

```
grammar-assistant/
├── src/
│   ├── background.ts           # Background service worker
│   ├── content-script.ts       # Content script for text selection
│   ├── types.ts                # TypeScript types
│   ├── constants.ts            # App constants
│   ├── popup/                  # Extension popup
│   ├── sidepanel/              # Side panel for corrections
│   ├── components/             # Reusable React components
│   ├── providers/              # AI provider implementations
│   ├── services/               # Business logic services
│   └── styles/                 # Global styles
├── public/
│   ├── manifest.json           # Extension manifest
│   └── icons/                  # Extension icons
└── dist/                       # Build output
```

## Features

- ✅ Text selection detection
- ✅ Context menu integration
- ✅ Keyboard shortcut (Cmd/Ctrl+Shift+E)
- ✅ Side panel UI
- 🚧 AI correction (coming next)
- 🚧 Local AI support (WebLLM)
- 🚧 Multiple correction styles
