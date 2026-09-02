export const FILTER_MODES = ["mask", "remove", "annotate"] as const;

export type FilterMode = (typeof FILTER_MODES)[number];

export type PrivacySpan = {
  label: string;
  start: number;
  end: number;
  text: string;
  score: number;
};

export type FilterRequest = {
  text: string;
  mode: FilterMode;
  mask_token: string;
  include_spans: boolean;
};

export type FilterResponse = {
  original_text: string;
  filtered_text: string;
  spans: PrivacySpan[];
  model: string;
};
