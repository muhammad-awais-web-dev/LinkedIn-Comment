# ✦ AI Comment Generator — Browser Extension

Generate AI-powered comments for **LinkedIn**, **Facebook**, and **Instagram** in seconds.

Select any post text → pick a template & tone → get a polished, platform-appropriate comment.

---

## Features

| Feature | Description |
|---|---|
| 🔍 Text selection detection | Floating button appears when you select text on supported platforms |
| 🎨 4 built-in templates | Supportive · Insightful · Question-based · Engagement-focused |
| 🎭 6 tone options | Professional · Friendly · Casual · Thoughtful · Bold · Encouraging |
| 🤖 Multi-provider AI | Google Gemini and OpenRouter (OpenAI-compatible) |
| 📝 Custom templates | Create, edit, and delete your own prompt templates |
| 📋 Copy & Insert | One-click copy or auto-insert into the page comment box |
| 💾 Persistent settings | API keys, templates, and preferences saved locally |

---

## Quick Start

### 1. Install dependencies & build

```bash
npm install
npm run build        # production build → dist/
npm run watch        # dev mode with hot rebuild
```

### 2. Load in Chrome

1. Open **chrome://extensions**
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder

### 3. Add an API key

Click the extension icon → ⚙️ Settings → enter your **Gemini** or **OpenRouter** API key.

- **Gemini**: Get a free key at [aistudio.google.com](https://aistudio.google.com/apikey)
- **OpenRouter**: Get a key at [openrouter.ai/keys](https://openrouter.ai/keys)

### 4. Generate a comment

1. Go to LinkedIn / Facebook / Instagram
2. **Select text** from any post
3. Click the floating ✦ button that appears
4. Choose template, tone, and provider
5. Click **✦ Generate Comment**
6. Edit if needed → **Copy** or **Insert**

---

## Project Structure

```
src/
├── shared/                     # Shared types, storage, prompt builder
│   ├── types.ts                # TypeScript type definitions
│   ├── storage.ts              # Chrome storage helpers
│   ├── promptBuilder.ts        # Dynamic prompt assembly
│   ├── defaultTemplates.ts     # 4 built-in comment templates
│   └── providers/
│       ├── AIProvider.ts       # Provider interface
│       ├── gemini.ts           # Google Gemini implementation
│       ├── openRouter.ts       # OpenRouter implementation
│       └── factory.ts          # Provider factory
├── background/
│   └── serviceWorker.ts        # MV3 service worker (API calls)
├── contentScripts/
│   └── index.ts                # Text selection + floating button
└── popup/
    ├── index.html              # Popup entry HTML
    ├── main.tsx                # React entry point
    ├── App.tsx                 # Root component
    ├── App.css                 # Full stylesheet
    └── components/
        ├── SelectedTextArea.tsx
        ├── TemplateSelector.tsx
        ├── ToneSelector.tsx
        ├── ProviderSelector.tsx
        ├── GenerateButton.tsx
        ├── OutputArea.tsx
        ├── SettingsPanel.tsx
        └── TemplateManager.tsx
```

---

## Tech Stack

- **Chrome Extension Manifest V3**
- **React 18** — popup UI
- **TypeScript** — full type safety
- **esbuild** — fast bundler (content script, service worker, popup)
- **Chrome Storage API** — local persistence

---

## Adding a New AI Provider

1. Create `src/shared/providers/myProvider.ts` implementing the `AIProvider` interface
2. Add the provider metadata to `PROVIDER_META` in `src/shared/types.ts`
3. Register it in `src/shared/providers/factory.ts`

```ts
// AIProvider interface
interface AIProvider {
  readonly name: string;
  generate(prompt: string): Promise<string>;
}
```

---

## Supported Platforms

| Platform | Tone Behavior | Emoji Level |
|---|---|---|
| LinkedIn | Professional, insight-driven | Minimal |
| Facebook | Conversational, friendly | Moderate |
| Instagram | Casual, engaging | Heavy |

---

## License

MIT
