import 'fake-indexeddb/auto';
import { expect,test } from 'vitest';
import { clear_data, commit_reading, get_daily, get_dataset, get_settings, list_readings, put_value, save_dataset, save_settings } from './storage';
import type { Dataset, Reading, Work } from '../domain/types';
import { DEFAULT_SETTINGS } from '../domain/types';
import { local_date } from '../domain/rules';

test('daily transaction deduplicates concurrent commits and survives deleting history',async()=>{
  await clear_data('all');
  const work={session_id:'s',phase:'selecting'} as Work;
  const base={deck_id:'provided-deck-v1',mode:'daily',local_date:local_date(),created_at:new Date().toISOString(),cards:[],revealed:[]} as unknown as Reading;
  const results=await Promise.all([commit_reading({...base,id:'one'},work),commit_reading({...base,id:'two'},work)]);
  expect(results[0].id).toBe(results[1].id);
  expect(await list_readings()).toHaveLength(1);
  await clear_data('history');expect(await list_readings()).toHaveLength(0);
  expect((await get_daily(base.deck_id))?.id).toBe(results[0].id);
});
test('clearing personal data preserves the offline dataset',async()=>{
  const dataset={dataset_version:'cached'} as Dataset;
  await save_dataset(dataset);await clear_data('all');
  expect(await get_dataset()).toEqual(dataset);
  expect(await get_daily('provided-deck-v1')).toBeUndefined();
});
test('volume preferences preserve old switches, persist silence and normalize invalid stored levels',async()=>{
  await put_value('meta','settings',{reversed_enabled:false,reversed_probability:0,music_enabled:false,effects_enabled:true});
  expect(await get_settings()).toEqual({...DEFAULT_SETTINGS,reversed_enabled:false,reversed_probability:0,music_enabled:false});
  await save_settings({...DEFAULT_SETTINGS,music_volume:0,effects_volume:73});
  expect(await get_settings()).toMatchObject({music_volume:0,effects_volume:73});
  await put_value('meta','settings',{...DEFAULT_SETTINGS,music_volume:-10,effects_volume:150});
  expect(await get_settings()).toMatchObject({music_volume:0,effects_volume:100});
  await put_value('meta','settings',{...DEFAULT_SETTINGS,music_volume:NaN,effects_volume:'loud'});
  expect(await get_settings()).toMatchObject({music_volume:28,effects_volume:55});
});
test('corrupt stored reversal settings and string switches are normalized before use',async()=>{
  await put_value('meta','settings',{reversed_enabled:'false',reversed_probability:NaN,music_enabled:1,effects_enabled:null});
  expect(await get_settings()).toEqual(DEFAULT_SETTINGS);
  await put_value('meta','settings',{...DEFAULT_SETTINGS,reversed_probability:250});
  expect(await get_settings()).toMatchObject({reversed_probability:100});
});
