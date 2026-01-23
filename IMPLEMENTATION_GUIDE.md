# Grammar Assistant - Technical Implementation Guide

## Overview

Building a Chrome extension for AI-powered grammar correction with local-first privacy approach using WebLLM and WebGPU.

**Tech Stack:**

- Chrome Extension (Manifest V3)
- React 19 + TypeScript 5
- Tailwind CSS 4
- @mlc-ai/web-llm (local AI)
- WebGPU (hardware acceleration)

**Development Approach:** Incremental steps with testing after each phase

---

## Phase 1: Project Setup & Foundation

### Step 1: Initialize Project Structure ✅

**Goal:** Set up the development environment with all necessary configurations

**Tasks:**

- [x] Initialize npm project with package.json
- [x] Install core dependencies (React, TypeScript, Tailwind CSS 4)
- [x] Configure TypeScript (tsconfig.json)
- [x] Configure Tailwind CSS 4 (tailwind.config.js + @import syntax)
- [x] Set up build tool (Webpack)
- [x] Create folder structure following the architecture plan
- [x] Create basic manifest.json (Manifest V3)

**Success Criteria:**

- ✅ Project builds without errors
- ✅ TypeScript compilation works
- ✅ Tailwind CSS 4 is configured

**Files Created:**

```
package.json (Tailwind CSS 4.1.18)
tsconfig.json
tailwind.config.js
webpack.config.js
public/manifest.json
src/background.ts
src/content-script.ts
src/types.ts
src/constants.ts
src/styles/global.css (@import 'tailwindcss')
src/popup/ (Popup.tsx, index.tsx, popup.html)
src/sidepanel/ (SidePanel.tsx, index.tsx, sidepanel.html)
```

**Completed:** ✅ January 23, 2026

---

### Step 2: Basic Extension Shell ✅

**Goal:** Create a minimal working Chrome extension that loads successfully

**Tasks:**

- [x] Create manifest.json with minimal permissions
- [x] Create basic background service worker (background.ts)
- [x] Create basic content script (content-script.ts)
- [x] Create popup HTML and entry point
- [x] Add extension icons (16, 48, 128px)
- [x] Configure build to output to dist/

**Success Criteria:**

- ✅ Extension loads in Chrome without errors
- ✅ Background script initializes
- ✅ Content script injects into pages
- ✅ Popup opens when clicking extension icon

**Test:**

1. ✅ Load unpacked extension in Chrome
2. ✅ Check extension icon appears in toolbar
3. ✅ Click icon - popup should open
4. ✅ Open DevTools - no console errors

**Completed:** ✅ January 23, 2026

---

### Step 3: Content Script - Text Selection Detection ✅

**Goal:** Detect when user selects text on any webpage

**Tasks:**

- [x] Implement text selection listener in content-script.ts
- [x] Store selected text and position
- [x] Add visual feedback (highlight or tooltip)
- [x] Handle selection changes
- [x] Test on various input types (textarea, contenteditable, etc.)

**Success Criteria:**

- ✅ Selection event fires on any text selection
- ✅ Selected text is captured accurately
- ✅ Works on Gmail, Twitter, LinkedIn, Discord

**Test:**

1. ✅ Open any webpage
2. ✅ Select text
3. ✅ Console should log selected text
4. ✅ Try on different input types

**Completed:** ✅ January 23, 2026

---

### Step 4: Context Menu Integration ⬜

**Goal:** Add right-click menu item "Correct with AI"

**Tasks:**

- [x] Register context menu in background.ts
- [x] Add "Correct with AI" menu item
- [x] Show only when text is selected
- [x] Handle context menu click event
- [x] Send selected text to background script
- [x] Add keyboard shortcut (Cmd/Ctrl+Shift+E)

**Success Criteria:**

- ✅ Right-click shows "Correct with AI" option
- ✅ Only appears when text is selected
- ✅ Clicking menu item triggers action
- ✅ Keyboard shortcut works

**Test:**

1. ✅ Select text on any page
2. ✅ Right-click → "Correct with AI" appears
3. ✅ Click menu item → action triggers
4. ✅ Press Cmd/Ctrl+Shift+E → action triggers

**Completed:** ✅ January 23, 2026

---

## Phase 2: Side Panel UI

### Step 5: Side Panel Setup ✅

**Goal:** Create side panel that opens when correction is triggered

**Tasks:**

- [x] Configure side panel in manifest.json
- [x] Create sidepanel/index.html entry point
- [x] Create SidePanel.tsx React component
- [x] Set up React rendering
- [x] Add Tailwind styling
- [x] Implement panel open/close functionality

**Success Criteria:**

- ✅ Side panel opens via chrome.sidePanel API
- ✅ React app renders in side panel
- ✅ Basic UI structure is visible
- ✅ Panel displays selected text

**Completed:** ✅ January 23, 2026

---

### Step 6: Side Panel UI Components ⬜

**Goal:** Build the core UI components for displaying corrections

**Tasks:**
**Success Criteria:**

- Side panel opens via chrome.sidePanel API
- React app renders in side panel
- Basic UI structure is visible
- Panel can be closed

**Test:**

1. Trigger correction action
2. Side panel opens on the right
3. React content is visible
4. Panel styling looks correct

---

### Step 6: Side Panel UI Components ⬜

**Goal:** Build the core UI components for displaying corrections

**Tasks:**

- [ ] Create OriginalTextCard component
- [ ] Create CorrectedTextCard component
- [ ] Create StyleSelector component (Formal/Casual/Brief)
- [ ] Create LoadingSpinner component
- [ ] Create Button component
- [ ] Create basic layout with Tailwind

**Success Criteria:**

- All components render correctly
- Styling matches design intent
- Components are reusable
- Dark mode support ready

**Test:**

1. Open side panel manually
2. Mock data should display in cards
3. Style selector shows all options
4. UI is responsive

---

### Step 7: Message Passing Architecture ⬜

**Goal:** Set up communication between content script, background, and side panel

**Tasks:**

- [ ] Define message types (TypeScript interfaces)
- [ ] Implement message handler in background.ts
- [ ] Implement message sender in content-script.ts
- [ ] Implement message listener in SidePanel.tsx
- [ ] Add error handling for failed messages
- [ ] Test bidirectional communication

**Success Criteria:**

- Content script can send text to background
- Background can open side panel
- Side panel receives selected text
- Side panel can send replacement text back

**Test:**

1. Select text → Trigger correction
2. Side panel opens with selected text displayed
3. Click "Replace" → Text updates in original field
4. No console errors

---

## Phase 3: Cloud AI Integration (MVP)

### Step 8: AI Provider Interface ⬜

**Goal:** Create abstract AI provider system for future flexibility

**Tasks:**

- [ ] Create providers/AIProvider.ts interface
- [ ] Define CorrectionResult type
- [ ] Define CorrectionStyle enum
- [ ] Create provider factory pattern
- [ ] Add error handling types

**Success Criteria:**

- Clean interface for AI providers
- Type-safe correction results
- Easy to add new providers

**Files:**

```typescript
// providers/AIProvider.ts
interface CorrectionResult {
  original: string;
  corrected: string;
  style: CorrectionStyle;
  changes: Change[];
  confidence: number;
}
```

---

### Step 9: OpenAI Provider Implementation ⬜

**Goal:** Implement cloud-based correction using OpenAI API (for testing)

**Tasks:**

- [ ] Create providers/OpenAIProvider.ts
- [ ] Implement correct() method
- [ ] Build grammar correction prompt
- [ ] Handle API responses
- [ ] Parse JSON responses
- [ ] Add error handling (rate limits, network errors)
- [ ] Add API key management in settings

**Success Criteria:**

- Can correct text using OpenAI API
- Returns structured correction results
- Error handling works
- API key is stored securely

**Test:**

1. Add OpenAI API key in settings
2. Select text → Trigger correction
3. Wait 2-3 seconds
4. Side panel shows corrected text
5. Changes are highlighted

---

### Step 10: Display Corrections in Side Panel ⬜

**Goal:** Show correction results with before/after comparison

**Tasks:**

- [ ] Display original text
- [ ] Display corrected text
- [ ] Show style used
- [ ] Display list of changes with explanations
- [ ] Add "Replace" button
- [ ] Add "Copy" button
- [ ] Implement loading state during API call

**Success Criteria:**

- Original and corrected text are clearly displayed
- Changes are listed with explanations
- User can see what was changed and why
- Buttons work correctly

**Test:**

1. Correct a text with errors
2. Side panel shows before/after
3. Changes section shows 3-5 specific edits
4. Click "Replace" → text updates in page
5. Click "Copy" → text copied to clipboard

---

### Step 11: Style Variations ⬜

**Goal:** Allow users to see text in different styles

**Tasks:**

- [ ] Implement style selector UI
- [ ] Add Formal style prompt
- [ ] Add Casual style prompt
- [ ] Add Brief style prompt
- [ ] Cache corrections to avoid re-requesting
- [ ] Allow quick style switching

**Success Criteria:**

- User can select different styles
- Each style produces appropriate tone
- Style changes don't require re-selection
- Cached results load instantly

**Test:**

1. Correct text with "Formal" style
2. Switch to "Casual" → see different version
3. Switch to "Brief" → see shorter version
4. Switch back to "Formal" → instant (cached)

---

### Step 12: Text Replacement in DOM ⬜

**Goal:** Replace selected text in the original input field

**Tasks:**

- [ ] Create TextReplacer utility class
- [ ] Handle standard input fields (input, textarea)
- [ ] Handle contenteditable elements
- [ ] Handle React-controlled inputs
- [ ] Trigger appropriate change events
- [ ] Add fallback to clipboard if replacement fails

**Success Criteria:**

- Replacement works on Gmail
- Replacement works on Twitter
- Replacement works on LinkedIn
- Replacement works on Slack
- Replacement works on Discord

**Test:**

1. Test on Gmail compose window
2. Test on Twitter tweet box
3. Test on LinkedIn post editor
4. Test on Slack message input
5. Test on Discord chat

---

## Phase 4: Local AI Integration

### Step 13: WebLLM Setup ⬜

**Goal:** Install and configure WebLLM for local AI inference

**Tasks:**

- [ ] Install @mlc-ai/web-llm package
- [ ] Configure WebGPU support detection
- [ ] Create WebLLMProvider.ts
- [ ] Implement model initialization
- [ ] Add WebGPU compatibility check
- [ ] Handle browsers without WebGPU

**Success Criteria:**

- WebLLM package installed
- Can detect WebGPU support
- Provider class structure ready
- Graceful fallback for unsupported browsers

**Test:**

1. Check WebGPU availability in browser
2. Console log WebLLM version
3. Verify GPU is detected

---

### Step 14: Model Selection UI ⬜

**Goal:** Allow users to choose which local model to download

**Tasks:**

- [ ] Create Settings page component
- [ ] Add model selection dropdown
- [ ] List available models (Phi-3, Gemma, TinyLlama)
- [ ] Show model sizes and descriptions
- [ ] Add "Download Model" button
- [ ] Add "Switch Model" functionality

**Success Criteria:**

- Settings page is accessible
- Models are listed with details
- User can select preferred model
- Selection is persisted

**Test:**

1. Open settings
2. See list of models
3. Select "Phi-3-mini"
4. Selection saves

---

### Step 15: Model Download with Progress ⬜

**Goal:** Download selected model with progress tracking

**Tasks:**

- [ ] Implement model download in WebLLMProvider
- [ ] Create progress callback handler
- [ ] Display download progress in UI
- [ ] Show progress bar (0-100%)
- [ ] Show download speed and ETA
- [ ] Cache model in IndexedDB/Chrome Storage
- [ ] Handle download interruptions

**Success Criteria:**

- Model downloads successfully
- Progress bar updates smoothly
- Download speed is displayed
- Model is cached after download
- Can resume interrupted downloads

**Test:**

1. Click "Download Phi-3-mini"
2. Progress bar shows 0% → 100%
3. Wait for completion (5-15 minutes)
4. Model is ready to use
5. Restart extension → model still available

---

### Step 16: Local AI Inference ⬜

**Goal:** Use downloaded model to correct text locally

**Tasks:**

- [ ] Implement correct() method in WebLLMProvider
- [ ] Build local correction prompt
- [ ] Handle streaming responses
- [ ] Parse model output to CorrectionResult
- [ ] Add timeout handling
- [ ] Optimize inference performance

**Success Criteria:**

- Local correction works offline
- Response time < 5 seconds
- Quality matches cloud API
- No data sent to servers

**Test:**

1. Disconnect internet
2. Select text → Trigger correction
3. Side panel shows corrections (5-10 seconds)
4. Quality is acceptable
5. Verify no network requests

---

### Step 17: AI Provider Switcher ⬜

**Goal:** Allow users to switch between cloud and local AI

**Tasks:**

- [ ] Add provider selection in settings
- [ ] Create AIContext for provider management
- [ ] Implement provider switching logic
- [ ] Save provider preference
- [ ] Show current provider in UI
- [ ] Add "Local" badge when using local AI

**Success Criteria:**

- User can choose Cloud or Local mode
- Switching works instantly
- Preference persists across sessions
- UI shows current mode

**Test:**

1. Set to "Local AI" mode
2. Correct text → uses local model
3. Switch to "Cloud API" mode
4. Correct text → uses OpenAI
5. Restart extension → preference saved

---

## Phase 5: Polish & UX

### Step 18: Correction History ⬜

**Goal:** Save recent corrections for quick reference

**Tasks:**

- [ ] Create HistoryManager service
- [ ] Store last 50 corrections in Chrome Storage
- [ ] Create History view component
- [ ] Add search/filter functionality
- [ ] Add "Reuse Correction" button
- [ ] Add "Clear History" option

**Success Criteria:**

- History persists across sessions
- Can view past corrections
- Can search history
- Can reuse previous corrections

**Test:**

1. Make 5 corrections
2. Open History tab
3. See all 5 corrections
4. Search for keyword
5. Click "Reuse" → text fills in

---

### Step 19: Settings & Preferences ⬜

**Goal:** Comprehensive settings page for customization

**Tasks:**

- [ ] Create SettingsManager service
- [ ] Implement settings persistence
- [ ] Add theme toggle (light/dark)
- [ ] Add default style preference
- [ ] Add keyboard shortcut customization
- [ ] Add "Reset to Defaults" option

**Success Criteria:**

- All settings persist
- Theme switching works
- Keyboard shortcuts are customizable
- Reset button works

**Test:**

1. Change theme → persists
2. Change default style → persists
3. Customize keyboard shortcut
4. Click "Reset" → defaults restore

---

### Step 20: Error Handling & Edge Cases ⬜

**Goal:** Handle all error scenarios gracefully

**Tasks:**

- [ ] Handle API failures (network, rate limits)
- [ ] Handle model loading failures
- [ ] Handle GPU unavailability
- [ ] Handle empty selections
- [ ] Handle very long texts (>5000 chars)
- [ ] Add user-friendly error messages
- [ ] Add retry mechanisms

**Success Criteria:**

- No unhandled errors in console
- User sees helpful error messages
- Errors don't break the extension
- Retry buttons work

**Test:**

1. Disconnect internet during API call
2. Select very long text (10k chars)
3. Try on browser without WebGPU
4. Use expired API key
5. All show appropriate error messages

---

### Step 21: Performance Optimization ⬜

**Goal:** Make the extension fast and responsive

**Tasks:**

- [ ] Optimize bundle size (code splitting)
- [ ] Lazy load components
- [ ] Implement response caching
- [ ] Debounce rapid corrections
- [ ] Optimize re-renders in React
- [ ] Minimize memory usage

**Success Criteria:**

- Bundle size < 500KB (excluding models)
- Side panel opens in < 500ms
- Corrections cached for instant re-display
- No memory leaks

**Test:**

1. Measure bundle size
2. Time side panel open speed
3. Check memory usage in Task Manager
4. Test 100 corrections → no slowdown

---

### Step 22: UI/UX Polish ⬜

**Goal:** Make the interface beautiful and intuitive

**Tasks:**

- [ ] Add smooth animations
- [ ] Implement loading skeletons
- [ ] Add success/error toast notifications
- [ ] Improve color scheme
- [ ] Add helpful tooltips
- [ ] Implement dark mode fully
- [ ] Add empty states
- [ ] Improve mobile responsiveness

**Success Criteria:**

- UI feels polished and professional
- Animations are smooth (60fps)
- Dark mode looks great
- No visual bugs

**Test:**

1. Open side panel → smooth animation
2. Trigger correction → loading skeleton
3. Correction completes → success toast
4. Switch to dark mode → looks good
5. Resize window → responsive

---

### Step 23: First-Time User Experience ⬜

**Goal:** Create smooth onboarding for new users

**Tasks:**

- [ ] Create welcome screen on first install
- [ ] Add step-by-step tutorial
- [ ] Explain model download process
- [ ] Add interactive demo
- [ ] Create "What's New" for updates
- [ ] Add help/documentation links

**Success Criteria:**

- New users understand how to use extension
- Model download process is clear
- Tutorial is helpful not annoying
- Can skip onboarding

**Test:**

1. Install extension fresh
2. Welcome screen appears
3. Tutorial guides through features
4. Can skip to settings
5. Help links work

---

## Phase 6: Testing & Quality

### Step 24: Cross-Website Testing ⬜

**Goal:** Ensure extension works on 20+ popular websites

**Tasks:**

- [ ] Test on Gmail (compose, reply)
- [ ] Test on Twitter (tweets, DMs)
- [ ] Test on LinkedIn (posts, messages)
- [ ] Test on Slack (messages, threads)
- [ ] Test on Discord (channels, DMs)
- [ ] Test on Facebook (posts, comments)
- [ ] Test on Reddit (posts, comments)
- [ ] Test on WhatsApp Web
- [ ] Test on Notion
- [ ] Test on Google Docs
- [ ] Test on Medium
- [ ] Test on Substack
- [ ] Test on GitHub (issues, PRs)
- [ ] Test on Jira
- [ ] Test on Confluence
- [ ] Create compatibility matrix

**Success Criteria:**

- Works on 90%+ of sites
- Document known issues
- Provide workarounds for unsupported sites

---

### Step 25: Automated Testing ⬜

**Goal:** Set up test suite for reliability

**Tasks:**

- [ ] Set up Jest for unit tests
- [ ] Write tests for TextReplacer
- [ ] Write tests for HistoryManager
- [ ] Write tests for SettingsManager
- [ ] Set up Playwright for E2E tests
- [ ] Write E2E test for full correction flow
- [ ] Set up CI/CD (GitHub Actions)

**Success Criteria:**

- 80%+ code coverage
- All tests pass
- E2E tests cover critical paths
- Tests run on every commit

---

### Step 26: Beta Testing ⬜

**Goal:** Get real user feedback before launch

**Tasks:**

- [ ] Recruit 20-50 beta testers
- [ ] Create feedback form
- [ ] Set up error reporting (optional)
- [ ] Monitor usage patterns
- [ ] Collect feature requests
- [ ] Fix critical bugs from feedback

**Success Criteria:**

- 20+ active beta testers
- 80%+ satisfaction rate
- Major bugs identified and fixed
- Feature priorities validated

---

## Phase 7: Launch Preparation

### Step 27: Chrome Web Store Preparation ⬜

**Goal:** Prepare all assets for Chrome Web Store submission

**Tasks:**

- [ ] Create store listing copy
- [ ] Design promotional images (1280x800)
- [ ] Create screenshots (1280x800 or 640x400)
- [ ] Record demo video (30-60 seconds)
- [ ] Write detailed description
- [ ] Prepare privacy policy
- [ ] Set up developer account ($5 fee)

**Success Criteria:**

- All assets ready
- Description is compelling
- Screenshots show key features
- Video demonstrates value

---

### Step 28: Documentation ⬜

**Goal:** Create comprehensive user and developer documentation

**Tasks:**

- [ ] Write README.md
- [ ] Create user guide
- [ ] Document keyboard shortcuts
- [ ] Create troubleshooting guide
- [ ] Document supported models
- [ ] Create contribution guide (if open source)
- [ ] Add inline code comments

**Success Criteria:**

- README explains project clearly
- User guide covers all features
- Troubleshooting addresses common issues
- Code is well-documented

---

### Step 29: Final Testing & Bug Fixes ⬜

**Goal:** Polish everything for launch

**Tasks:**

- [ ] Fix all critical bugs
- [ ] Test on Windows, Mac, Linux
- [ ] Test on different Chrome versions
- [ ] Verify all permissions are necessary
- [ ] Check for console errors
- [ ] Verify no data leaks
- [ ] Performance audit

**Success Criteria:**

- Zero critical bugs
- Works on all platforms
- No unnecessary permissions
- No console errors
- Privacy verified

---

### Step 30: Chrome Web Store Submission ⬜

**Goal:** Submit extension for review

**Tasks:**

- [ ] Create optimized production build
- [ ] Upload to Chrome Web Store
- [ ] Submit for review
- [ ] Respond to reviewer questions
- [ ] Address any rejection reasons
- [ ] Publish when approved

**Success Criteria:**

- Extension submitted
- Review completed
- Extension published
- Accessible to all users

---

## Post-Launch Tasks

### Step 31: Monitoring & Analytics ⬜

**Goal:** Track usage and identify issues

**Tasks:**

- [ ] Monitor Chrome Web Store reviews
- [ ] Track daily active users
- [ ] Monitor error reports
- [ ] Collect feature requests
- [ ] Analyze usage patterns
- [ ] Plan next features

---

### Step 32: Marketing & Growth ⬜

**Goal:** Grow user base

**Tasks:**

- [ ] Launch on ProductHunt
- [ ] Post on Reddit (r/chrome, r/productivity, r/EnglishLearning)
- [ ] Share on Twitter/X
- [ ] Create landing page
- [ ] Write blog post
- [ ] Reach out to tech blogs

---

## Success Metrics

### MVP Success (Phase 1-3)

- ✅ Extension loads without errors
- ✅ Can select text and trigger correction
- ✅ Side panel displays corrections
- ✅ Can replace text in page
- ✅ Works on 5+ major websites

### Full Product Success (Phase 4-5)

- ✅ Local AI works offline
- ✅ Model downloads successfully
- ✅ Corrections are high quality
- ✅ UI is polished
- ✅ Works on 15+ websites

### Launch Success (Phase 6-7)

- ✅ Published on Chrome Web Store
- ✅ 4.0+ star rating
- ✅ 100+ users in first week
- ✅ Positive user feedback

---

## Notes

### After Each Step:

1. ✅ Complete all tasks in the step
2. ✅ Run tests to verify success criteria
3. ✅ Mark step as complete (⬜ → ✅)
4. ✅ Commit changes to git
5. ✅ Demo the feature
6. ✅ Get approval before moving to next step

### Development Principles:

- **Incremental:** Build and test one feature at a time
- **Working software:** Keep extension in working state
- **Test everything:** Verify on real websites
- **User-first:** Prioritize UX over features
- **Privacy:** No data leaves device in local mode

### Ready to Start?

Begin with **Step 1: Initialize Project Structure** when you're ready!
