# Changes Made: Agentic System Integration

This document tracks all files added, modified, and configured during the migration of the Agentic Invoice Processing & Chatbot System from `scfPortal` (`D:\MAD1\SCF\scfPortal`) to `scfPortal 2` (`D:\MAD1\SCF\scfPortal 2`).

---

## 1. Summary of Migration

The agentic system enables an AI assistant (Nexus AI) capable of:
- **Intelligent Invoice Processing**: Extracting, analyzing, and processing invoice details from text or uploaded documents.
- **Automated / Guided Loan Booking**: Fetching SCF program terms, validating credit limits, orchestrating OTP verification, and booking loans via the SCF API.
- **SCF Data & Market Intelligence**: Providing financial insights, portfolio breakdowns, and contextual financial assistance.
- **Multi-Modal Interaction**: Supporting text chat, voice input (speech-to-text), and invoice file uploads.

Per your preference, the assistant is integrated strictly as a **non-intrusive floating widget** across the portal without modifying existing sidebar routes or layouts.

---

## 2. New Files Created (Zero impact on existing codebase)

| # | File Path | Description |
|---|-----------|-------------|
| 1 | `src/services/geminiService.js` | Gemini AI integration layer. Handles conversation history, intent detection, system instructions (Nexus AI), invoice parsing, and tool dispatching. |
| 2 | `src/services/scfApiService.js` | Backend integration service connecting the agent to SCF endpoints (`fetchProgramDetails`, `createWorkItem`, `bookLoan`). |
| 3 | `src/components/AskAI/AskAIChatbot.js` | Primary Chatbot UI component. Implements floating launcher button, responsive drawer/modal, voice recorder, file uploader, structured loan approval cards, and OTP verification flows. |
| 4 | `src/components/AskAI/AskAIPage.js` | Embedded container page component for AskAI (available for full-page view if needed in the future). |
| 5 | `src/data/scfDummyData.js` | Mock dataset (products, programs, buyers/suppliers, invoices, settlements, spoke details) utilized for fallback responses and simulation. |
| 6 | `src/utils/chatbotLogger.js` | Development logging utility sending non-blocking diagnostic payloads to the local log server. |
| 7 | `logServer.js` | Standalone Node.js logging server running on port `9001` that writes diagnostic logs to `chatbot-debug.log`. |

---

## 3. Existing Files Modified (Minimal & Additive Only)

### A. `src/App.js`
- **Import added**:
  ```javascript
  import AskAIChatbot from "components/AskAI/AskAIChatbot";
  ```
- **Component mounted**:
  Added `<AskAIChatbot />` directly inside `<ThemeProvider>` after `<Outlet />` for both RTL and LTR configurations.
- **Impact**: Zero effect on existing routes or dashboard views. The chatbot renders as an overlay positioned at the bottom right.

### B. `package.json`
- **Dependencies added**:
  - `"@google/genai": "^1.41.0"` (Official Google Gen AI SDK)
  - `"motion": "^12.38.0"` (Smooth widget animations)
- **DevDependencies added**:
  - `"concurrently": "^10.0.5"` (Enables running frontend and `logServer.js` together)
- **Scripts updated**:
  - `"start": "concurrently \"node logServer.js\" \"react-scripts start\""`

### C. `.env`
- Added the environment variable:
  ```env
  REACT_APP_GEMINI_API_KEY=
  ```
  *(Reserved for you to manually supply your API key)*

---

## 4. Verification of Existing Functionality

- **No existing routes modified**: `src/routes.js` remains completely untouched.
- **No existing components overwritten**: All pre-existing features in `scfPortal 2` (such as E-onboarding, Early Payment Recommendation, and nested routes) are unchanged.
- **Graceful Fallback**: If `REACT_APP_GEMINI_API_KEY` is not yet set, the chatbot warns in the console without crashing or affecting the rest of the application.

---

## 5. UI Enhancements: Close to Full-Screen & Responsive Reasoning

Following user feedback:
1. **Close to Full-Screen Layout**:
   - The assistant window defaults to **Close to Full-Screen** (`width: min(1440px, 94vw)`, `height: min(920px, 92vh)`), centered on screen with a soft blurred backdrop (`backdrop-filter: blur(4px)`).
   - Added a **View Mode Toggle button** (`Maximize2` / `Minimize2` icons) in the top-right header so you can switch between large workspace view and compact bottom-right drawer (`450px × 640px`) at any time.
2. **Live Responsive Behavior During Reasoning**:
   - **Multi-Stage Reasoning Tracker**: Cycles dynamically through 4 SCF agentic stages while waiting for AI and API responses:
     1. *Understanding Intent & Entities* (0-1.8s)
     2. *SCF Program & Limit Inspection* (1.8-3.8s)
     3. *Underwriting & Rules Evaluation* (3.8-6.0s)
     4. *Finalizing Actionable Intelligence* (6.0s+)
   - **Visual Feedback**:
     - Live elapsed stopwatch timer (`⏱ X.Xs`).
     - Animated bouncing dots and pulsing aura on the agent avatar.
     - 4-step progress pill tracker with checkmarks for completed steps and highlight for active step.
     - Header activity badge updating dynamically (`Reasoning (Step X/4 • X.Xs)...`).
     - Dynamic input placeholder & spinning send button reflecting active processing status.

---

## 6. Next Steps to Run

1. **Add Your Gemini API Key**:
   Open `.env` in `scfPortal 2` and paste your key:
   ```env
   REACT_APP_GEMINI_API_KEY=your_actual_gemini_api_key
   ```
2. **Install Dependencies** (if needed):
   ```bash
   npm install
   ```
3. **Start the Application**:
   ```bash
   npm start
   ```
   This will launch both `logServer.js` on port `9001` and the React dev server.
