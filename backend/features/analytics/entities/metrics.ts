export interface MetricRow {
  kind: string;
  total: number;
}
export interface SiteMetrics {
  views: number;
  clicks: number;
  unavailable?: boolean;
}
