import type { MetricsReport } from '@backend/features/analytics/entities/metrics';
import { getMetrics } from '@frontend/api/analytics/metrics';
import { getAdminMetrics } from '@frontend/api/admin/metrics';

type Variant = 'overview' | 'full' | 'admin';

interface Labels {
  views: string;
  clicks: string;
  ctr: string;
  visitors: string;
  evolution: string;
  byType: string;
  byLabel: string;
  paths: string;
  referrers: string;
  countries: string;
  devices: string;
  direct: string;
  typePrimary: string;
  typeProduct: string;
  period: string;
  days: (n: number) => string;
  noData: string;
  unavailable: string;
  error: string;
  seeMore: string;
}

const labels = (lang: string): Labels =>
  lang === 'en'
    ? {
        views: 'Views',
        clicks: 'Clicks',
        ctr: 'Click rate',
        visitors: 'Visitors',
        evolution: 'Views and clicks',
        byType: 'Clicks by type',
        byLabel: 'Clicks by button or product',
        paths: 'Most viewed pages',
        referrers: 'Traffic sources',
        countries: 'Countries',
        devices: 'Devices',
        direct: 'Direct',
        typePrimary: 'Main button',
        typeProduct: 'Product',
        period: 'Period',
        days: (n) => `${n} days`,
        noData: 'No data for this period yet.',
        unavailable: 'Metrics are unavailable right now.',
        error: 'Could not load metrics.',
        seeMore: 'See detailed metrics',
      }
    : {
        views: 'Visualizações',
        clicks: 'Cliques',
        ctr: 'Taxa de clique',
        visitors: 'Visitantes',
        evolution: 'Visualizações e cliques',
        byType: 'Cliques por tipo',
        byLabel: 'Cliques por botão ou produto',
        paths: 'Páginas mais vistas',
        referrers: 'Origem do tráfego',
        countries: 'Países',
        devices: 'Dispositivos',
        direct: 'Direto',
        typePrimary: 'Botão principal',
        typeProduct: 'Produto',
        period: 'Período',
        days: (n) => `${n} dias`,
        noData: 'Ainda sem dados neste período.',
        unavailable: 'As métricas estão indisponíveis no momento.',
        error: 'Não foi possível carregar as métricas.',
        seeMore: 'Ver métricas detalhadas',
      };

const esc = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string,
  );

const fmt = (value: number, lang: string) =>
  new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'pt-BR').format(Math.round(value));

const card = (value: string, label: string) =>
  `<div class="rounded-2xl border border-[#ead8bd] bg-white p-4">
    <strong class="block font-[Outfit] text-2xl font-medium tabular-nums text-[#b88333]">${value}</strong>
    <span class="text-xs text-[#625a51]">${esc(label)}</span>
  </div>`;

interface Point {
  day: string;
  views: number;
  clicks: number;
}

function fillDays(report: MetricsReport): Point[] {
  const found = new Map(report.viewsByDay.map((row) => [row.day, row]));
  const out: Point[] = [];
  const today = new Date();
  for (let i = report.days - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    const row = found.get(key);
    out.push({ day: key, views: row?.views ?? 0, clicks: row?.clicks ?? 0 });
  }
  return out;
}

function chart(points: Point[], label: string): string {
  const W = 640;
  const H = 200;
  const padX = 12;
  const padTop = 16;
  const padBottom = 28;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;
  const n = points.length;
  const max = Math.max(1, ...points.map((point) => Math.max(point.views, point.clicks)));
  const x = (index: number) => (n <= 1 ? padX + innerW / 2 : padX + (index / (n - 1)) * innerW);
  const y = (value: number) => padTop + innerH - (value / max) * innerH;
  const baseline = padTop + innerH;
  const line = (key: 'views' | 'clicks') =>
    points
      .map(
        (point, index) => `${index ? 'L' : 'M'}${x(index).toFixed(1)},${y(point[key]).toFixed(1)}`,
      )
      .join(' ');
  const area = n
    ? `${line('views')} L${x(n - 1).toFixed(1)},${baseline.toFixed(1)} L${x(0).toFixed(1)},${baseline.toFixed(1)} Z`
    : '';
  const grid = [0, 0.25, 0.5, 0.75, 1]
    .map(
      (fraction) =>
        `<line x1="${padX}" y1="${(padTop + innerH * fraction).toFixed(1)}" x2="${(W - padX).toFixed(1)}" y2="${(padTop + innerH * fraction).toFixed(1)}" stroke="#efe4d2" stroke-width="1" />`,
    )
    .join('');
  const step = Math.max(1, Math.ceil(n / 6));
  const ticks = points
    .map((point, index) => ({ point, index }))
    .filter(({ index }) => index % step === 0 || index === n - 1)
    .map(({ point, index }) => {
      const [, month, day] = point.day.split('-');
      return `<text x="${x(index).toFixed(1)}" y="${(H - 8).toFixed(1)}" text-anchor="middle" font-size="10" fill="#9b8b74">${day}/${month}</text>`;
    })
    .join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="h-44 w-full" role="img" aria-label="${esc(label)}" preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id="vira-metric-area" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#b88333" stop-opacity="0.35" />
        <stop offset="100%" stop-color="#b88333" stop-opacity="0" />
      </linearGradient>
    </defs>
    ${grid}
    ${area ? `<path d="${area}" fill="url(#vira-metric-area)" />` : ''}
    <path d="${line('views')}" fill="none" stroke="#b88333" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
    <path d="${line('clicks')}" fill="none" stroke="#5b4428" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round" stroke-linejoin="round" />
    ${ticks}
  </svg>`;
}

function barList(
  title: string,
  items: { label: string; total: number }[],
  empty: string,
  lang: string,
): string {
  const max = Math.max(1, ...items.map((item) => item.total));
  return `<section class="rounded-2xl border border-[#ead8bd] bg-white p-5">
    <h3 class="mb-3 font-[Outfit] text-lg text-[#17130d]">${esc(title)}</h3>
    ${
      items.length
        ? `<ul class="space-y-3">${items
            .map(
              (item) => `<li>
          <div class="flex items-center justify-between gap-3 text-sm">
            <span class="min-w-0 truncate text-[#5b4428]">${esc(item.label)}</span>
            <span class="shrink-0 tabular-nums font-medium text-[#6f4716]">${fmt(item.total, lang)}</span>
          </div>
          <div class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#f1e7d5]">
            <div class="h-full rounded-full bg-[#b88333]" style="width:${Math.max(3, (item.total / max) * 100).toFixed(1)}%"></div>
          </div>
        </li>`,
            )
            .join('')}</ul>`
        : `<p class="text-sm text-[#625a51]">${esc(empty)}</p>`
    }
  </section>`;
}

function renderReport(report: MetricsReport, variant: Variant, lang: string): string {
  const L = labels(lang);
  if (report.unavailable)
    return `<div class="rounded-2xl border border-[#ead8bd] bg-white p-6 text-sm text-[#625a51]">${esc(L.unavailable)}</div>`;
  const points = fillDays(report);
  const ctr = `${(report.ctr * 100).toFixed(1)}%`;
  const tabs = (['overview', 'full', 'admin'] as Variant[]).includes(variant)
    ? `<div class="mb-5 flex flex-wrap items-center gap-2">
        <span class="text-xs font-semibold uppercase tracking-wide text-[#9b6823]">${esc(L.period)}</span>
        ${[7, 30, 90]
          .map(
            (days) =>
              `<button type="button" data-metrics-range="${days}" class="btn btn-sm rounded-full ${days === report.days ? 'btn-primary' : 'btn-outline'}">${esc(L.days(days))}</button>`,
          )
          .join('')}
      </div>`
    : '';
  const kpis = `<div class="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
    ${card(fmt(report.views, lang), L.views)}
    ${card(fmt(report.clicks, lang), L.clicks)}
    ${card(ctr, L.ctr)}
    ${card(fmt(report.visitors, lang), L.visitors)}
  </div>`;
  const evolution = `<section class="mb-5 rounded-2xl border border-[#ead8bd] bg-white p-5">
    <div class="mb-2 flex flex-wrap items-center justify-between gap-3">
      <h3 class="font-[Outfit] text-lg text-[#17130d]">${esc(L.evolution)}</h3>
      <div class="flex items-center gap-4 text-xs text-[#625a51]">
        <span class="flex items-center gap-1.5"><span class="inline-block h-2.5 w-2.5 rounded-full bg-[#b88333]"></span>${esc(L.views)}</span>
        <span class="flex items-center gap-1.5"><span class="inline-block h-2.5 w-2.5 rounded-full bg-[#5b4428]"></span>${esc(L.clicks)}</span>
      </div>
    </div>
    ${
      report.views || report.clicks
        ? chart(points, L.evolution)
        : `<p class="py-10 text-center text-sm text-[#625a51]">${esc(L.noData)}</p>`
    }
  </section>`;
  const typeLabel = (type: string) =>
    type === 'primary' ? L.typePrimary : type === 'product' ? L.typeProduct : type;
  const blocks = [
    barList(
      L.byType,
      report.clicksByType.map((row) => ({ label: typeLabel(row.type), total: row.total })),
      L.noData,
      lang,
    ),
    barList(
      L.byLabel,
      report.clicksByLabel.map((row) => ({ label: row.label, total: row.total })),
      L.noData,
      lang,
    ),
    barList(
      L.paths,
      report.topPaths.map((row) => ({ label: row.path, total: row.total })),
      L.noData,
      lang,
    ),
    barList(
      L.referrers,
      report.topReferrers.map((row) => ({
        label: row.referrer === 'direto' || !row.referrer ? L.direct : row.referrer,
        total: row.total,
      })),
      L.noData,
      lang,
    ),
    barList(
      L.countries,
      report.countries.map((row) => ({ label: row.country, total: row.total })),
      L.noData,
      lang,
    ),
    barList(
      L.devices,
      report.devices.map((row) => ({
        label:
          row.device === 'mobile'
            ? lang === 'en'
              ? 'Mobile'
              : 'Celular'
            : row.device === 'desktop'
              ? lang === 'en'
                ? 'Desktop'
                : 'Computador'
              : row.device,
        total: row.total,
      })),
      L.noData,
      lang,
    ),
  ];
  const visible = variant === 'overview' ? blocks.slice(0, 3) : blocks;
  const grid = `<div class="grid gap-4 lg:grid-cols-2">${visible.join('')}</div>`;
  const more =
    variant === 'overview'
      ? `<a href="/app/metricas" class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#8b5b1e] hover:text-[#9b6823]">${esc(L.seeMore)} →</a>`
      : '';
  return `${tabs}${kpis}${evolution}${grid}${more}`;
}

async function load(root: HTMLElement): Promise<void> {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'pt';
  const variant = (root.dataset.variant as Variant) || 'full';
  const site = root.dataset.site || '';
  const days = [7, 30, 90].includes(Number(root.dataset.days)) ? Number(root.dataset.days) : 30;
  root.innerHTML = `<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">${Array.from({ length: 4 })
    .map(
      () =>
        '<div class="h-[86px] animate-pulse rounded-2xl border border-[#ead8bd] bg-[#fcfaf6]"></div>',
    )
    .join(
      '',
    )}</div><div class="mt-5 h-48 animate-pulse rounded-2xl border border-[#ead8bd] bg-[#fcfaf6]"></div>`;
  try {
    const report = site ? await getAdminMetrics(site, days) : await getMetrics(days);
    root.innerHTML = renderReport(report, variant, lang);
    root.querySelectorAll<HTMLButtonElement>('[data-metrics-range]').forEach((button) =>
      button.addEventListener('click', () => {
        root.dataset.days = button.dataset.metricsRange;
        void load(root);
      }),
    );
  } catch {
    root.innerHTML = `<div class="rounded-2xl border border-[#ead8bd] bg-white p-6 text-sm text-[#812929]">${esc(labels(lang).error)}</div>`;
  }
}

export function initSiteMetrics(): void {
  document.querySelectorAll<HTMLElement>('[data-site-metrics]').forEach((root) => void load(root));
}
