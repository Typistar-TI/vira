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
  const messages: ChatMessage[] = [];
  let busy = false;
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
  const scroll = () => {
    log.scrollTop = log.scrollHeight;
  };
  const bubble = (role: ChatMessage['role'], text: string) => {
    const node = document.createElement('div');
    node.className =
      role === 'user'
        ? 'ml-auto max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed text-white'
        : 'mr-auto max-w-[85%] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm leading-relaxed';
    node.style.background = role === 'user' ? 'var(--a-accent)' : 'var(--a-soft)';
    node.textContent = text;
    log.append(node);
    scroll();
    return node;
  };
  const hideSuggestions = () =>
    root.querySelector('[data-assistant-suggestions]')?.classList.add('hidden');
  const engage = async () => {
    if (
      root.dataset.engaged === 'true' ||
      root.dataset.engaging === 'true' ||
      !root.classList.contains('assistant-demo')
    )
      return;
    const intro = root.querySelector<HTMLElement>('[data-hero-intro]');
    if (!intro) return;
    root.dataset.engaging = 'true';
    intro.inert = true;
    intro.setAttribute('aria-hidden', 'true');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Fade out at the original width, change layout while invisible, then reveal.
    // Animating grid widths rewraps every line on every frame and stalls typing.
    if (!reduced) {
      const outgoing = [intro, log]
        .filter((node): node is HTMLElement => Boolean(node))
        .map((node) =>
          node.animate(
            [
              { opacity: 1, transform: 'translateY(0)' },
              { opacity: 0, transform: 'translateY(-8px)' },
            ],
            { duration: 180, easing: 'ease-out', fill: 'forwards' },
          ),
        );
      await Promise.all(outgoing.map((animation) => animation.finished));
      root.dataset.engaged = 'true';
      const incoming = log.animate(
        [
          { opacity: 0, transform: 'translateY(12px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 360, easing: 'cubic-bezier(.22,1,.36,1)' },
      );
      outgoing.forEach((animation) => animation.cancel());
      await incoming.finished;
    }
    root.dataset.engaged = 'true';
    delete root.dataset.engaging;
  };
  const submit = async (question: string) => {
    const clean = question.trim().slice(0, 500);
    if (!clean || busy) return;
    void engage();
    started = true;
    bubble('user', clean);
    if (!persist) messages.push({ role: 'user', content: clean });
    input.value = '';
    input.style.height = 'auto';
    busy = true;
    input.disabled = send.disabled = true;
    hideSuggestions();
    const pending = bubble('assistant', '');
    const dots = document.createElement('span');
    dots.className = 'inline-flex gap-1';
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      dot.className = 'h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-50';
      dot.style.animationDelay = `${i * 0.15}s`;
      dots.append(dot);
    }
    pending.append(dots);
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
    if (input.value.trim()) void engage();
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
