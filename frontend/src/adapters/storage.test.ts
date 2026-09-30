import 'fake-indexeddb/auto';
import { expect,test } from 'vitest';
import { clear_data, commit_reading, get_daily, get_dataset, list_readings, save_dataset } from './storage';
import type { Dataset, Reading, Work } from '../domain/types';
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
