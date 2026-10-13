// AI AssistView drawer: Syncfusion AIAssistViewComponent in a right drawer,
// opened by a FAB on the pages where it simplifies the workflow. Mock provider via IoC;
// responses labelled simulated; stop cancels; fallback template for unmatched prompts.

import { useCallback, useRef, useState } from 'react';
import { X, Sparkles, Square } from 'lucide-react';
import {
  AIAssistViewComponent, type PromptRequestEventArgs
} from '@syncfusion/ej2-react-interactive-chat';
import { useApp } from '../application/app-context';
import type { AssistantRequest } from '../application/session-store';

const SUGGESTIONS: Record<string, string[]> = {
  dashboard: ['Summarize completion by track', 'How is attendance trending?', 'How many students are at risk?'],
  schedule: ['Which sessions conflict this week?', 'Where is CS-101 on Tuesday?', 'Which rooms are free Thursday?'],
  plan: ['Which modules are running late vs baseline?', 'When does the Project milestone land?'],
  students: ['How many students are at risk?', 'Show completion by track.']
};

let req = 0;

export function AiDrawer({ page, label }: { page: string; label: string }) {
  const { assistant, buildSnapshot } = useApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const pendingRef = useRef<string | null>(null);
  const assistRef = useRef<AIAssistViewComponent>(null);

  const handlePromptRequested = useCallback(async (prompt: string) => {
    // PromptRequest flow: respond through the provider, then queue the response text.
    const id = `req-${++req}`;
    pendingRef.current = id;
    setBusy(true);
    const request: AssistantRequest = {
      id, page, prompt, snapshot: buildSnapshot(page, prompt), createdAt: Date.now()
    };
    try {
      const response = await assistant.respond(request);
      assistRef.current?.addPromptResponse(response.text, true);
    } catch {
      // cancelled or failed — cancelled is silent; failure shows the fallback message
      if (pendingRef.current === id) {
        assistRef.current?.addPromptResponse('Something interrupted that answer. Ask again in a moment.', true);
      }
    } finally {
      if (pendingRef.current === id) { pendingRef.current = null; setBusy(false); }
    }
  }, [assistant, buildSnapshot, page]);

  const onPromptRequest = useCallback((args: PromptRequestEventArgs) => {
    void handlePromptRequested(String(args.prompt ?? ''));
  }, [handlePromptRequested]);

  return (
    <>
      <button
        type="button"
        className={`ai-fab${busy ? ' ai-fab-busy' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls="ai-drawer"
        aria-label={open ? 'Close AI assistant' : 'Ask the AI assistant'}
        title={open ? 'Close AI assistant' : 'Ask the AI assistant'}
      >
        {open ? <X size={20} aria-hidden="true" /> : <Sparkles size={20} aria-hidden="true" />}
      </button>
      {open ? (
        <div id="ai-drawer" className="ai-drawer" role="complementary" aria-label={`${label} AI assistant`}>
          <div className="ai-drawer-head">
            <span><Sparkles size={16} aria-hidden="true" /> AI assistant — {label}</span>
            <div>
              {busy ? (
                <button type="button" className="app-header-button" onClick={() => pendingRef.current && assistant.cancel(pendingRef.current)}
                  aria-label="Stop generating response" title="Stop generating response">
                  <Square size={14} aria-hidden="true" />
                </button>
              ) : null}
              <button type="button" className="app-header-button" onClick={() => setOpen(false)}
                aria-label="Close AI assistant">
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
          <AIAssistViewComponent
            ref={assistRef}
            promptSuggestions={SUGGESTIONS[page] ?? []}
            promptRequest={onPromptRequest}
          />
          <p className="ai-drawer-note">Responses are simulated from this demo session.</p>
        </div>
      ) : null}
    </>
  );
}