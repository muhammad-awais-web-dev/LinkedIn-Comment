# ✦ AI Comment Generator for LinkedIn

A Chrome extension that generates AI-powered comments for LinkedIn posts. Select any post text, pick a template and tone, and get a polished, professional comment in seconds.

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-%E2%9D%A4-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/muhammad-awais-web-dev)
[![GitHub Stars](https://img.shields.io/github/stars/muhammad-awais-web-dev/LinkedIn-Comment?style=social)](https://github.com/muhammad-awais-web-dev/LinkedIn-Comment)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Muhammad%20Awais-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/muhammad-awais-web-dev/)

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-0A66C2)
![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)

> **⭐ If you find this useful, please star the repo — it helps a lot!**
>
> **❤️ [Sponsor this project](https://github.com/sponsors/muhammad-awais-web-dev)** to support ongoing development.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **Post text detection** | Automatically extracts post text when you click the ✦ button on any comment bar |
| ✦ **Inline panel** | Full generate → edit → insert flow right inside LinkedIn — no popup needed |
| 🎨 **4 built-in templates** | Supportive · Insightful · Question-based · Engagement-focused |
| 🎭 **6 tone options** | Professional · Friendly · Casual · Thoughtful · Bold · Encouraging |
| 🤖 **Multi-provider AI** | Google Gemini and OpenRouter (supports dozens of models) |
| 📝 **Custom templates** | Create, edit, and delete your own prompt templates |
| 📋 **Copy & Insert** | One-click copy to clipboard or auto-insert into the comment box |
| 💾 **Persistent settings** | API keys, templates, and preferences saved locally via Chrome Storage |
| 🎯 **LinkedIn-optimized** | Professional tone, minimal emoji usage, insight-driven commentary |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/muhammad-awais-web-dev/LinkedIn-Comment.git
cd LinkedIn-Comment
npm install
```

### 2. Build

```bash
npm run build        # Production build → dist/
npm run watch        # Dev mode with auto-rebuild on file changes
```

### 3. Load in Chrome

1. Open **chrome://extensions**
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the **`dist/`** folder

### 4. Add an API Key

Click the extension icon → ⚙️ **Settings** → enter your API key:

| Provider | Get a Key |
|---|---|
| **Google Gemini** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (free tier available) |
| **OpenRouter** | [openrouter.ai/keys](https://openrouter.ai/keys) (pay-per-use, many models) |

### 5. Generate a Comment

1. Go to **linkedin.com**
2. Find any post and click the **✦ AI Comment** button in the comment bar
3. The inline panel opens — choose a template, tone, and provider
4. Click **✦ Generate Comment**
5. Edit if needed → **Insert** into the comment box or **Copy** to clipboard

You can also **select text** on any post and a floating ✦ button will appear.

---

## 📂 Project Structure

```
├── manifest.json                # Chrome Extension Manifest V3
├── build.mjs                    # esbuild bundler config
├── package.json
├── tsconfig.json
├── Logo.svg                     # Extension logo
├── icons/                       # Extension icons (16/32/48/128 PNG)
└── src/
    ├── shared/                  # Shared modules
    │   ├── types.ts             # TypeScript type definitions
    │   ├── storage.ts           # Chrome storage helpers
    │   ├── promptBuilder.ts     # Dynamic prompt assembly
    │   ├── defaultTemplates.ts  # 4 built-in comment templates
    │   └── providers/
    │       ├── AIProvider.ts    # Provider interface
    │       ├── gemini.ts        # Google Gemini implementation
    │       ├── openRouter.ts    # OpenRouter implementation
    │       └── factory.ts       # Provider factory
    ├── background/
    │   └── serviceWorker.ts     # MV3 service worker (handles API calls)
    ├── contentScripts/
    │   └── index.ts             # LinkedIn injection: ✦ button, inline panel, FAB
    └── popup/
        ├── index.html           # Popup entry HTML
        ├── main.tsx             # React entry point
        ├── App.tsx              # Root component
        ├── App.css              # LinkedIn-themed stylesheet
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

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Chrome Extension Manifest V3** | Extension platform |
| **React 18** | Popup UI |
| **TypeScript 5.6** | Type safety across the codebase |
| **esbuild** | Fast bundler for content script, service worker, and popup |
| **Chrome Storage API** | Local persistence of settings, templates, and API keys |
| **Shadow DOM** | Inline panel isolation from LinkedIn's page styles |

---

## 🤖 Supported AI Models

### Google Gemini
- `gemini-2.0-flash` (default)
- `gemini-2.0-flash-lite`
- `gemini-1.5-flash`
- `gemini-1.5-pro`

### OpenRouter
- `google/gemini-2.0-flash-001`
- `meta-llama/llama-3.3-70b-instruct`
- `deepseek/deepseek-chat`
- `mistralai/mistral-small-24b-instruct-2501`

---

## 🔧 Adding a New AI Provider

1. Create `src/shared/providers/myProvider.ts` implementing the `AIProvider` interface:

```ts
interface AIProvider {
  readonly name: string;
  generate(prompt: string): Promise<string>;
}
```

2. Add provider metadata to `PROVIDER_META` in `src/shared/types.ts`
3. Register it in `src/shared/providers/factory.ts`

---

## 🔒 Privacy

- **No data leaves your browser** except the prompt sent to your chosen AI provider.
- API keys are stored locally in Chrome storage — never transmitted to any third-party server.
- No analytics, tracking, or telemetry.
- The extension only activates on `linkedin.com`.

---

## 📦 Building for Chrome Web Store

```bash
npm run build
cd dist && zip -r ../ai-comment-generator.zip . && cd ..
```

Upload the generated `.zip` file to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

---

## � Support This Project

If this extension saves you time, consider supporting its development:

- ⭐ **[Star this repo](https://github.com/muhammad-awais-web-dev/LinkedIn-Comment)** — it's free and helps others discover it
- ❤️ **[Become a GitHub Sponsor](https://github.com/sponsors/muhammad-awais-web-dev)** — support ongoing development
- 🔗 **[Connect on LinkedIn](https://www.linkedin.com/in/muhammad-awais-web-dev/)** — let's network!

---

## 🎯 Portfolio Project

This project demonstrates proficiency in:

- **Chrome Extension Development** — Manifest V3, content scripts, service workers, Shadow DOM
- **React & TypeScript** — Component architecture, hooks, type-safe state management
- **AI Integration** — Multi-provider API abstraction (Gemini, OpenRouter)
- **Modern Tooling** — esbuild bundler, CSS custom properties, Chrome Storage API
- **UX Design** — LinkedIn-native theming, inline panels, responsive popup UI

👉 **[View the source code](https://github.com/muhammad-awais-web-dev/LinkedIn-Comment)**

---

## 📄 License

MIT — free to use, modify, and distribute.

---

**Made with ✦ by [Muhammad Awais](https://github.com/muhammad-awais-web-dev)** · [LinkedIn](https://www.linkedin.com/in/muhammad-awais-web-dev/)
