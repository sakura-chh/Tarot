import { expect, test } from 'vitest';
import dataset from '../../../backend/content/cards.json';
import manifest from '../../../media/manifest.json';
import type { Dataset } from './types';
import { DEFAULT_SETTINGS } from './types';
import { offline_session } from './rules';
import { media_url, source_url, validate_dataset, validate_manifest, validate_session } from './validation';

const data=dataset as Dataset;
test('current catalog and verified bundle remain usable; older concise data also works',()=>{
  expect(validate_dataset(data)).toBe(data);
  expect(validate_manifest(manifest)).toBe(manifest);
  const concise=structuredClone(data);for(const card of concise.cards){delete card.meaning_details;delete card.meaning_source;}
  expect(validate_dataset(concise)).toBe(concise);
});
test.each(['https://evil.example/card.webp','//evil.example/card.webp','javascript:alert(1)','data:image/svg+xml,<svg/>',
  '/assets/main.js','/media/v1/../main.js','/media/v1/%2e%2e','/media\\v1\\card.webp','/media/v1/card.webp?token=private','/media/v1/card.webp#fragment'])('unsafe media URL is rejected: %s',url=>{
  expect(media_url(url)).toBe(false);
  const corrupt=structuredClone(data);corrupt.cards[0].images.display_url=url;
  expect(()=>validate_dataset(corrupt)).toThrow();
  const bundle=structuredClone(manifest);bundle.items[0].url=url;
  expect(()=>validate_manifest(bundle)).toThrow();
});
test('dangerous reference protocols and embedded credentials never become links',()=>{
  for(const url of ['javascript:alert(1)','data:text/html,<script/>','http://example.com','https://user:password@example.com']){
    expect(source_url(url)).toBe(false);
    const corrupt=structuredClone(data);corrupt.cards[0].meaning_source!.url=url;
    expect(()=>validate_dataset(corrupt)).toThrow();
  }
  expect(source_url('https://www.shenpowang.com/taluopai/jieshi/d23044.html')).toBe(true);
});
test('manifest sizes, hashes, duplicates and the required dataset entry are validated',()=>{
  for(const change of [
    (m:typeof manifest)=>{m.items[0].sha256='bad';},
    (m:typeof manifest)=>{m.items[0].bytes=-1;},
    (m:typeof manifest)=>{m.total_bytes++;},
    (m:typeof manifest)=>{m.items.push(m.items[0]);},
    (m:typeof manifest)=>{m.dataset_url='/media/v1/unlisted.json';},
    (m:typeof manifest)=>{m.items.find(i=>i.url===m.dataset_url)!.required=false;},
    (m:typeof manifest)=>{m.items[0].bytes=512*1024*1024;m.total_bytes=m.items.reduce((n,i)=>n+i.bytes,0);},
  ]){const corrupt=structuredClone(manifest);change(corrupt);expect(()=>validate_manifest(corrupt)).toThrow();}
});
test('malformed catalog and sessions cannot crash through a weak type assertion',()=>{
  for(const value of [null,[],{},'text',{...data,cards:[null]}, {...data,spreads:[null]}, {...data,audio:null}])expect(()=>validate_dataset(value)).toThrow();
  const session=offline_session(data,'free',3,DEFAULT_SETTINGS);expect(validate_session(session,data)).toBe(session);
  for(const corrupt of [{...session,deck_id:'another-deck'}, {...session,mode:'unknown'}, {...session,count:1000000},
    {...session,mode:'daily',count:3}, {...session,created_at:'bad'}, {...session,settings_snapshot:{reversed_enabled:'false',reversed_probability:50}},
    {...session,slots:session.slots.map((s,i)=>i===0?{...s,slot_id:session.slots[1].slot_id}:s)},
    {...session,slots:session.slots.map((s,i)=>i===0?null:s)}])expect(()=>validate_session(corrupt,data)).toThrow();
});
