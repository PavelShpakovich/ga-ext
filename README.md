# Grammar Assistant

A professional, privacy-first AI writing companion that runs entirely in your browser using **WebGPU** and **WebLLM**. Correct grammar, polish style, and refine your writing across the web without ever sending your data to a server.

## Features

- **Privacy First**: 100% local processing. No data leaves your machine.
- **WebGPU Accelerated**: High-performance AI execution directly on your hardware.
- **Multi-Language Support**: Specialized optimization for English, Russian, German, Spanish, and French. Automatic language detection helps you stay in the right context.
- **5 Professional Styles**:
  - **Standard**: Neutral, natural corrections.
  - **Formal**: Professional tone, no contractions.
  - **Academic**: Structured for scholarly writing.
  - **Simple**: Clear, easy-to-read sentence structures.
  - **Casual**: Polished but relaxed tone.
- **Curated Model Lineup**: Choose from high-parameter local models including Gemma 2 9B, Llama 3.1 8B, and Qwen 2.5 7B.
- **Universal Integration**:
  - **Context Menu**: Right-click to correct selection.
  - **Keyboard Shortcut**: `Cmd/Ctrl+Shift+E` for instant check.
  - **Side Panel**: Specialized interface for reviewing improvements and reasoning.

## Tech Stack

- **React 19** with TypeScript 5
- **Tailwind CSS 4** for ultra-fast, modern styling
- **@mlc-ai/web-llm** for local LLM execution
- **i18next** for robust internationalization
- **Lucide React** for consistent iconography
- **Chrome Extension Manifest V3**

## Development

### Prerequisites

- **Chrome/Edge** with WebGPU support enabled.
- **Node.js** (v18+) and npm.

### Setup

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Build for Development**:

   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

### Loading in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select the `dist` folder in this project directory.

## Documentation

- [Coding Standards](./CODING_STANDARDS.md) - Guidelines for project maintainers.

## Privacy

This extension does not track you, does not use cookies, and does not send your text to any third-party APIs. All "brains" are downloaded to your local browser cache (via IndexedDB) and executed on your local GPU.
