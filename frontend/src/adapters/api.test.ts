import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import dataset from '../../../backend/content/cards.json';
import manifest from '../../../media/manifest.json';
import type { Dataset } from '../domain/types';
import { DEFAULT_SETTINGS } from '../domain/types';
import { offline_session } from '../domain/rules';
import { load_dataset, create_session } from './api';
import { get_dataset, save_dataset } from './storage';

vi.mock('./storage',()=>({get_dataset:vi.fn(),save_dataset:vi.fn()}));
const data=dataset as Dataset;
beforeEach(()=>{vi.clearAllMocks();vi.mocked(get_dataset).mockResolvedValue(undefined);});
afterEach(()=>vi.unstubAllGlobals());
test('untrusted manifest never triggers an external or executable-resource fetch',async()=>{
  const fetch=vi.fn().mockResolvedValue(new Response(JSON.stringify({...manifest,dataset_url:'https://evil.example/steal'})));
  vi.stubGlobal('fetch',fetch);
  await expect(load_dataset()).rejects.toThrow();expect(fetch).toHaveBeenCalledTimes(1);expect(save_dataset).not.toHaveBeenCalled();
});
test('changed dataset bytes fail the SHA-256 check and are never persisted',async()=>{
  const changed=structuredClone(data);changed.cards[0].name_zh='modified';
  const fetch=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(manifest))).mockResolvedValueOnce(new Response(JSON.stringify(changed)));
  vi.stubGlobal('fetch',fetch);
  await expect(load_dataset()).rejects.toThrow('校验失败');expect(save_dataset).not.toHaveBeenCalled();
});
test('invalid cached data is revalidated even when its version matches',async()=>{
  const bad=structuredClone(data);bad.cards[0].images.display_url='https://evil.example/private';
  vi.mocked(get_dataset).mockResolvedValue(bad);
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify(manifest))));
  await expect(load_dataset()).rejects.toThrow();
});
test('safe cached data is used when the online service is unavailable',async()=>{
  vi.mocked(get_dataset).mockResolvedValue(data);vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new TypeError('offline')));
  expect(await load_dataset()).toBe(data);
});
test('valid-looking substituted draw results cannot change the requested mode or settings',async()=>{
  const substituted=offline_session(data,'free',10,DEFAULT_SETTINGS);
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({...substituted,source:'server'}))));
  await expect(create_session(data,'daily',1,DEFAULT_SETTINGS)).rejects.toThrow('本轮请求不一致');
});
