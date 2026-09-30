export type Mode = 'daily' | 'past_present_future' | 'situation_obstacle_advice' | 'free';
export interface MeaningTopics { general: string; love: string; career: string; advice: string }
export interface MeaningDetails { overview: string; symbolism: string; upright: MeaningTopics; reversed: MeaningTopics }
export interface Card {
  id: string; deck_id: string; name_zh: string; name_en: string; aliases: string[];
  arcana: 'major' | 'minor'; suit: string | null; rank: string | null;
  display_number: number | null; sort_order: number; keywords_upright: string[];
  keywords_reversed: string[]; meaning_upright: string; meaning_reversed: string;
  meaning_details?: MeaningDetails; meaning_source?: { name: string; url: string }; meaning_version?: string;
  content_status: string; images: { thumbnail_url: string; display_url: string };
}
export interface Spread { id: Mode; name: string; description: string; min_count: number; max_count: number; positions: string[] }
export interface Dataset {
  dataset_version: string; schema_version: string; rules_version: string; deck_id: string;
  card_back_url: string; audio: { music: string; shuffle: string; flip: string };
  cards: Card[]; spreads: Spread[];
}
export interface Settings { reversed_enabled: boolean; reversed_probability: number; music_enabled: boolean; effects_enabled: boolean }
export const DEFAULT_SETTINGS: Settings = { reversed_enabled: true, reversed_probability: 50, music_enabled: true, effects_enabled: true };
export interface Slot { slot_id: string; card_id: string; is_reversed: boolean }
export interface Session {
  session_id: string; request_id: string; source: 'server' | 'offline';
  dataset_version: string; deck_id: string; mode: Mode; count: number;
  settings_snapshot: Pick<Settings, 'reversed_enabled' | 'reversed_probability'>;
  slots: Slot[]; created_at: string;
}
export interface Work extends Session { selected: string[]; phase: 'selecting' | 'revealing'; question: string; reading_id?: string; group: number }
export interface PickedCard { card: Card; slot_id: string; is_reversed: boolean; position: string; display_blob?: Blob }
export interface Reading {
  id: string; session_id: string; mode: Mode; deck_id: string; dataset_version: string;
  source: 'server' | 'offline'; question: string; notes: string; created_at: string;
  local_date: string; timezone: string; settings_snapshot: Session['settings_snapshot'];
  cards: PickedCard[]; revealed: string[];
}
export interface Resource { url: string; bytes: number; sha256: string; group: 'core' | 'audio'; required: boolean }
export interface Manifest { bundle_version: string; dataset_version: string; dataset_url: string; total_bytes: number; items: Resource[] }
export interface BundleState { bundle_version: string; manifest: Manifest; ready: boolean; audio_ready: boolean }
