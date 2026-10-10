export interface MetricRow {
  kind: string;
  total: number;
}

export interface MetricsReport {
  days: number;
  views: number;
  clicks: number;
  ctr: number;
  visitors: number;
  viewsByDay: { day: string; views: number; clicks: number }[];
  clicksByType: { type: string; total: number }[];
  clicksByLabel: { label: string; total: number }[];
  topPaths: { path: string; total: number }[];
  topReferrers: { referrer: string; total: number }[];
  countries: { country: string; total: number }[];
  devices: { device: string; total: number }[];
  unavailable?: boolean;
}

export const emptyReport = (days: number): MetricsReport => ({
  days,
  views: 0,
  clicks: 0,
  ctr: 0,
  visitors: 0,
  viewsByDay: [],
  clicksByType: [],
  clicksByLabel: [],
  topPaths: [],
  topReferrers: [],
  countries: [],
  devices: [],
});
