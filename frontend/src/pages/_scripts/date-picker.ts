const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];
const WEEK = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const pad = (value: number) => String(value).padStart(2, '0');
const iso = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;
const formatDisplay = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
};

let popover: HTMLElement | null = null;
let activeInput: HTMLInputElement | null = null;
let activeHidden: HTMLInputElement | null = null;
let viewYear = 0;
let viewMonth = 0;

function normalize() {
  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear -= 1;
  } else if (viewMonth > 11) {
    viewMonth = 0;
    viewYear += 1;
  }
}

function close() {
  popover?.classList.add('hidden');
  activeInput = null;
  activeHidden = null;
}

function setValue(value: string) {
  if (!activeInput || !activeHidden) return;
  activeHidden.value = value;
  activeInput.value = formatDisplay(value);
  activeHidden.dispatchEvent(new Event('input', { bubbles: true }));
  activeHidden.dispatchEvent(new Event('change', { bubbles: true }));
  close();
}

function pick(year: number, month: number, day: number) {
  setValue(iso(year, month, day));
}

function render() {
  if (!popover) return;
  popover.querySelector('[data-title]')!.textContent = `${MONTHS[viewMonth]} ${viewYear}`;
  const days = popover.querySelector<HTMLElement>('[data-days]')!;
  const first = new Date(viewYear, viewMonth, 1).getDay();
  const total = new Date(viewYear, viewMonth + 1, 0).getDate();
  const today = new Date();
  const selected = activeHidden?.value || '';
  const cells: string[] = [];
  for (let i = 0; i < first; i += 1) cells.push('<span></span>');
  for (let day = 1; day <= total; day += 1) {
    const value = iso(viewYear, viewMonth, day);
    const isSelected = value === selected;
    const isToday =
      today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
    const classes = [
      'grid h-9 w-9 place-items-center rounded-lg text-sm tabular-nums',
      isSelected ? 'bg-[#b88333] font-semibold text-white' : 'text-[#17130d] hover:bg-[#fff4df]',
      !isSelected && isToday ? 'ring-1 ring-[#d8ae73]' : '',
    ]
      .filter(Boolean)
      .join(' ');
    cells.push(
      `<button type="button" class="${classes}" data-day="${value}" aria-label="${value}">${day}</button>`,
    );
  }
  days.innerHTML = cells.join('');
}

function position() {
  if (!popover || !activeInput) return;
  const rect = activeInput.getBoundingClientRect();
  const width = popover.offsetWidth || 288;
  const height = popover.offsetHeight || 320;
  let left = rect.left;
  let top = rect.bottom + 8;
  if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
  if (left < 8) left = 8;
  if (top + height > window.innerHeight - 8) top = Math.max(8, rect.top - height - 8);
  popover.style.left = `${Math.round(left)}px`;
  popover.style.top = `${Math.round(top)}px`;
}

function ensurePopover(): HTMLElement {
  if (popover) return popover;
  popover = document.createElement('div');
  popover.className =
    'fixed z-[120] hidden w-72 rounded-2xl border border-[#ead8bd] bg-white p-3 shadow-[0_24px_60px_-24px_rgba(95,59,12,0.4)]';
  popover.innerHTML = `
    <div class="mb-2 flex items-center justify-between">
      <button type="button" data-prev class="btn btn-ghost btn-sm btn-circle" aria-label="Mês anterior">‹</button>
      <span data-title class="text-sm font-semibold text-[#17130d]"></span>
      <button type="button" data-next class="btn btn-ghost btn-sm btn-circle" aria-label="Próximo mês">›</button>
    </div>
    <div class="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#9b6823]">
      ${WEEK.map((day) => `<span>${day}</span>`).join('')}
    </div>
    <div data-days class="mt-1 grid grid-cols-7 gap-1"></div>
    <div class="mt-2 flex items-center justify-between border-t border-[#f0e6d5] pt-2">
      <button type="button" data-today class="btn btn-ghost btn-xs">Hoje</button>
      <button type="button" data-clear class="btn btn-ghost btn-xs text-[#812929]">Limpar</button>
    </div>`;
  document.body.append(popover);
  popover.querySelector('[data-prev]')!.addEventListener('click', () => {
    viewMonth -= 1;
    normalize();
    render();
  });
  popover.querySelector('[data-next]')!.addEventListener('click', () => {
    viewMonth += 1;
    normalize();
    render();
  });
  popover.querySelector('[data-today]')!.addEventListener('click', () => {
    const now = new Date();
    pick(now.getFullYear(), now.getMonth(), now.getDate());
  });
  popover.querySelector('[data-clear]')!.addEventListener('click', () => setValue(''));
  popover.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-day]');
    if (!button) return;
    const [year, month, day] = button.dataset.day!.split('-').map(Number);
    pick(year, month - 1, day);
  });
  document.addEventListener('click', (event) => {
    if (!popover || popover.classList.contains('hidden')) return;
    const target = event.target as Node;
    if (popover.contains(target)) return;
    if (activeInput && (activeInput === target || activeInput.contains(target))) return;
    close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
  window.addEventListener('resize', close);
  return popover;
}

function open(input: HTMLInputElement, hidden: HTMLInputElement) {
  ensurePopover();
  const host = input.closest('dialog') ?? document.body;
  if (popover!.parentElement !== host) host.append(popover!);
  activeInput = input;
  activeHidden = hidden;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(hidden.value);
  const base = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date();
  viewYear = base.getFullYear();
  viewMonth = base.getMonth();
  render();
  popover!.classList.remove('hidden');
  position();
}

export function enhanceDatePickers() {
  document.querySelectorAll<HTMLInputElement>('input[type="date"]').forEach((input) => {
    if (input.dataset.datePicker === 'ready') return;
    input.dataset.datePicker = 'ready';
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = input.name;
    hidden.value = input.value;
    input.removeAttribute('name');
    input.type = 'text';
    input.readOnly = true;
    input.autocomplete = 'off';
    input.classList.add('cursor-pointer');
    input.insertAdjacentElement('afterend', hidden);
    input.value = formatDisplay(hidden.value);
    input.addEventListener('click', () => open(input, hidden));
    input.addEventListener('focus', () => open(input, hidden));
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open(input, hidden);
      }
    });
  });
}
