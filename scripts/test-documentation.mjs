import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const markdown=[];
const walk=dir=>{for(const entry of readdirSync(dir,{withFileTypes:true})){
  const path=join(dir,entry.name);
  if(entry.isDirectory())walk(path);
  else if(entry.name.endsWith('.md'))markdown.push(path);
}};
walk(join(root,'docs'));
markdown.push(join(root,'README.md'));
markdown.push(join(root,'extensions/raycast-workstation/README.md'));

test('local Markdown links resolve',()=>{
  const missing=[];
  for(const file of markdown){
    const text=readFileSync(file,'utf8');
    for(const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)){
      const href=match[1].trim();
      if(!href||href.startsWith('#')||/^(?:https?:|mailto:)/.test(href))continue;
      const target=decodeURIComponent(href.split('#')[0]);
      if(target&&!existsSync(resolve(dirname(file),target)))missing.push(`${relative(root,file)} -> ${href}`);
    }
  }
  assert.deepEqual(missing,[]);
});

test('documentation keeps Raycast and Alfred hotkeys in their intended owners',()=>{
  assert.ok(existsSync(join(root,'docs/hotkeys.md')));
  assert.match(readFileSync(join(root,'docs/hotkeys.md'),'utf8'),/Raycast Focus & Layouts/);
  assert.match(readFileSync(join(root,'docs/modules/alfred.md'),'utf8'),/## Hotkeys and commands/);
  const retired=[
    'docs/modules/alfred-hotkeys.md',
    'docs/modules/alfred-fde-hotkeys.md',
    'docs/modules/alfred-tf-hotkeys.md',
    'docs/modules/raycast-hotkeys.md',
  ];
  for(const path of retired)assert.equal(existsSync(join(root,path)),false,path);
  for(const file of markdown){
    const text=readFileSync(file,'utf8');
    for(const path of retired)assert.equal(text.includes(path.split('/').at(-1)),false,`${relative(root,file)} references ${path}`);
  }
});

test('reader entry points present core before the two productivity choices',()=>{
  for(const file of ['README.md','docs/README.md','docs/setup.md']){
    const text=readFileSync(join(root,file),'utf8');
    assert.match(text,/core/i,file);
    assert.match(text,/Raycast Focus & Layouts/i,file);
    assert.match(text,/Alfred.*Karabiner.*Rectangle Pro/is,file);
  }
  const profiles=readFileSync(join(root,'docs/setup-profiles.md'),'utf8');
  assert.match(profiles,/TF and FDE belong to.*Alfred/is);
  assert.match(profiles,/Raycast Focus & Layouts.*does not use.*profiles/is);
});
