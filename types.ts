export interface CountryData {
  country_code: string;
  country_name?: string;
  stations: number;
  median_power_kw: number;
  fast_dc_share: number;
  unique_models: number;
  coverage_norm: number;
  capacity_norm: number;
  fastshare_norm: number;
  availability_norm: number;
  EIRI: number; // EV Infrastructure Readiness Index
  gap_value: number;
  cluster: number;
  base: number;
  infra_heavy: number;
  availability_heavy: number;
  lat?: number;
  lng?: number;
}

export interface CentroidData {
  [key: string]: [number, number];
}

export type MetricType = 'EIRI' | 'stations' | 'gap_value' | 'availability_norm';