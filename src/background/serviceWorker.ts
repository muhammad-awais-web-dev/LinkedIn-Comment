/* ──────────────────────────────────────────────────────────────
   Background Service Worker  (Manifest V3)
   • Handles AI generation requests from the popup
   • Manages popup-window creation from the content script
   ────────────────────────────────────────────────────────────── */

import type {
  ExtensionMessage,
  GenerateRequestMsg,
  ProviderId,
  ProviderConfig,
} from '../shared/types';
import { createProvider } from '../shared/providers/factory';

// ── Message router ────────────────────────────────────────────
chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void,
  ) => {
    switch (message.action) {
      case 'OPEN_POPUP':
        handleOpenPopup();
        break;

      case 'GENERATE_REQUEST':
        // Must return true to keep the message channel open for async response
        handleGenerate(message).then(sendResponse).catch((err) =>
          sendResponse({
            action: 'GENERATE_RESPONSE',
            status: 'error',
            error: String(err?.message ?? err),
          }),
        );
        return true; // async response

      default:
        break;
    }
  },
);

// ── Open popup as a small window ──────────────────────────────
function handleOpenPopup(): void {
  const popupUrl = chrome.runtime.getURL('popup/index.html');

  chrome.windows.create({
    url: popupUrl,
    type: 'popup',
    width: 430,
    height: 620,
    focused: true,
  });
}

// ── Generate comment via the selected AI provider ─────────────
async function handleGenerate(
  msg: GenerateRequestMsg,
): Promise<{
  action: 'GENERATE_RESPONSE';
  status: 'ok' | 'error';
  result?: string;
  error?: string;
}> {
  const providerId: ProviderId = msg.providerId;

  // Read API key + model from storage
  const stored = await chrome.storage.local.get('providerConfigs');
  const configs: Record<ProviderId, ProviderConfig> | undefined =
    stored.providerConfigs;

  const config = configs?.[providerId];

  if (!config?.apiKey) {
    return {
      action: 'GENERATE_RESPONSE',
      status: 'error',
      error: `No API key configured for ${providerId}. Open Settings to add one.`,
    };
  }

  const provider = createProvider(providerId, config);

  try {
    const result = await provider.generate(msg.prompt);
    return { action: 'GENERATE_RESPONSE', status: 'ok', result };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { action: 'GENERATE_RESPONSE', status: 'error', error: errorMsg };
  }
}

// ── Keep service worker alive when needed ─────────────────────
// (MV3 service workers can go idle; this is a no-op heartbeat listener)
chrome.runtime.onInstalled.addListener(() => {
  console.log('[AI Comment Generator] Extension installed / updated.');
});
