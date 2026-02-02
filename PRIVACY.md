# Privacy Policy for Grammar Assistant

**Effective Date:** January 25, 2026

At Grammar Assistant, we are committed to providing a professional writing tool while maintaining the highest standard of user privacy. This extension is designed from the ground up to be a privacy-first tool.

## 1. 100% Local AI Processing

The core function of Grammar Assistant is to correct and improve your text. Unlike traditional grammar checkers, **your text is never sent to a remote server.**

- All AI processing occurs locally on your device using WebGPU and WebLLM.
- Your input text, corrected output, and explanations are processed in your browser's memory and stay on your machine.

## 2. Information We Do Not Collect

- **No Text Collection:** We do not collect or transmit any text you type or select for correction. Selected text may be stored temporarily in session storage for transfer between extension components and is cleared quickly.
- **No Browsing History:** We do not monitor your browsing activity or collect information about the websites you visit.
- **No Personal Identification:** We do not require account creation, and we do not collect personal information such as names, emails, or IP addresses.

## 3. Storage and Preferences

The extension uses your browser's local storage (`chrome.storage.local`) only to save your preferences, such as:

- Your preferred writing style (Standard, Formal, etc.).
- The AI model you have selected.
- The status of your local model cache.

This data remains on your device and is not synchronized to any external servers.

## 3.1 Temporary Session Storage (Inter-Context Transfer)

When you trigger corrections from the context menu or keyboard shortcut, the selected text may be stored temporarily in **session storage** (`chrome.storage.session`) so it can be passed from the background service worker to the side panel. This data is:

- Ephemeral and automatically cleared after delivery or a short timeout.
- Not persisted across browser restarts.
- Never transmitted to any server.

## 3.2 Error Logs

To improve reliability, we store a small number of **sanitized error logs** locally (no text content, no selections, no user input). These logs include only timestamps, categories, and short messages to help diagnose crashes.

## 4. Third-Party Connections (Model Weights)

To function, the extension must download AI model weights from **Hugging Face** (`huggingface.co`).

- These are standard HTTPS requests to download public model files.
- No user-specific data or text is sent to Hugging Face during this process.

## 5. Permissions Justification

- **activeTab/contextMenus:** Used only to capture the specific text selection you wish to correct.
- **sidePanel:** Used to display corrections in a user-friendly interface.
- **storage:** Used strictly to remember your settings and model status on your device.
- **offscreen:** Used to run OCR (Optical Character Recognition) processing via Tesseract.js in a background context. This allows the extension to extract text from images and process it locally on your device without sending any data to external servers.

## 6. Contact

If you have any questions about this Privacy Policy, you can contact the developer via the GitHub repository at [https://github.com/PavelShpakovich/ext-ga](https://github.com/PavelShpakovich/ext-ga).
