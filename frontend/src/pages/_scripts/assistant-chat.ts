import { loadHistory, streamAssistant, type ChatMessage } from '@frontend/api/assistant/chat';

function initAssistant(root: HTMLElement) {
  const panel = root.querySelector<HTMLElement>('[data-assistant-panel]');
  const log = root.querySelector<HTMLElement>('[data-assistant-log]');
  const form = root.querySelector<HTMLFormElement>('[data-assistant-form]');
  const input = root.querySelector<HTMLTextAreaElement>('[data-assistant-input]');
  const send = root.querySelector<HTMLButtonElement>('[data-assistant-send]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-assistant-toggle]');
  if (!panel || !log || !form || !input || !send) return;
  const endpoint = root.dataset.endpoint || '/api/assistant/chat';
  const lang = root.dataset.lang === 'en' ? 'en' : 'pt';
  const persist = root.dataset.persist === 'true';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const messages: ChatMessage[] = [];
  let busy = false;
  let playing = false;
  let started = false;
  const storageKey = `vira-assistant:${location.hostname}`;
  let conversation = '';
  if (persist) {
    try {
      conversation = localStorage.getItem(storageKey) || '';
    } catch {
      /* private browser */
    }
    if (!/^[0-9a-f-]{36}$/.test(conversation)) conversation = crypto.randomUUID();
    try {
      localStorage.setItem(storageKey, conversation);
    } catch {
      /* private browser */
    }
  }
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const scroll = () => {
    log.scrollTop = log.scrollHeight;
  };
  const dots = () => {
    const node = document.createElement('span');
    node.className = 'inline-flex gap-1';
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      dot.className = 'h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-50';
      dot.style.animationDelay = `${i * 0.15}s`;
      node.append(dot);
    }
    return node;
  };
  const bubble = (role: ChatMessage['role'], text: string) => {
    const node = document.createElement('div');
    node.className =
      role === 'user'
        ? 'ml-auto rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed text-white'
        : 'mr-auto rounded-2xl rounded-bl-md px-4 py-2.5 text-sm leading-relaxed';
    node.style.background = role === 'user' ? 'var(--a-accent)' : 'var(--a-soft)';
    node.textContent = text;
    log.append(node);
    scroll();
    return node;
  };
  const hideSuggestions = () =>
    root.querySelector('[data-assistant-suggestions]')?.classList.add('hidden');
  const streamText = async (node: HTMLElement, text: string) => {
    for (let i = 0; i < text.length; i += 6) {
      node.textContent = text.slice(0, i + 6);
      scroll();
      await wait(10);
    }
    node.textContent = text;
    scroll();
  };
  const playScript = async () => {
    let script: { role: ChatMessage['role']; text: string }[] = [];
    try {
      script = JSON.parse(root.dataset.script || '[]');
    } catch {
      script = [];
    }
    if (!script.length) return;
    playing = true;
    started = true;
    log.replaceChildren();
    input.disabled = send.disabled = true;
    for (const message of script) {
      if (message.role === 'user') {
        bubble('user', message.text);
        await wait(reduced ? 0 : 220);
      } else {
        const pending = bubble('assistant', '');
        if (!reduced) {
          pending.append(dots());
          await wait(140);
          pending.textContent = '';
          await streamText(pending, message.text);
          await wait(120);
        } else {
          pending.textContent = message.text;
          scroll();
        }
      }
    }
    playing = false;
    input.disabled = send.disabled = false;
  };
  const submit = async (question: string) => {
    const clean = question.trim().slice(0, 500);
    if (!clean || busy || playing) return;
    started = true;
    bubble('user', clean);
    if (!persist) messages.push({ role: 'user', content: clean });
    input.value = '';
    input.style.height = 'auto';
    busy = true;
    input.disabled = send.disabled = true;
    hideSuggestions();
    const pending = bubble('assistant', '');
    pending.append(dots());
    try {
      const answer = await streamAssistant({
        endpoint,
        body: persist ? { conversation, message: clean } : { messages, lang },
        onToken: (text) => {
          pending.textContent = text;
          scroll();
        },
      });
      pending.textContent = answer || (lang === 'en' ? 'Please try again.' : 'Tente novamente.');
      if (!persist && answer) messages.push({ role: 'assistant', content: answer });
    } catch {
      pending.textContent =
        lang === 'en' ? 'Please try again in a moment.' : 'Tente novamente em instantes.';
    } finally {
      busy = false;
      input.disabled = send.disabled = false;
      input.focus();
    }
  };
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void submit(input.value);
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submit(input.value);
    }
  });
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 112)}px`;
  });
  root
    .querySelectorAll<HTMLButtonElement>('[data-assistant-suggestion]')
    .forEach((button) =>
      button.addEventListener('click', () => void submit(button.textContent || '')),
    );
  const open = (value: boolean) => {
    panel.classList.toggle('hidden', !value);
    toggle?.setAttribute('aria-expanded', String(value));
    if (value) input.focus();
  };
  toggle?.addEventListener('click', () => open(panel.classList.contains('hidden')));
  root.querySelector('[data-assistant-close]')?.addEventListener('click', () => open(false));
  if (!persist && root.dataset.script) void playScript();
  if (persist)
    void loadHistory(endpoint.replace(/\/chat$/, '/history'), conversation)
      .then((history) => {
        if (!history.length || started) return;
        log.replaceChildren();
        history.forEach((item) => bubble(item.role, item.content));
        hideSuggestions();
      })
      .catch(() => {});
}
document.querySelectorAll<HTMLElement>('[data-assistant]').forEach(initAssistant);
