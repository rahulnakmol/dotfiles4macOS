import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {workspacePlan,executeWorkspace}=require('../raycast/.config/raycast/workspaces/core.js');
const catalog=JSON.parse(readFileSync(new URL('../raycast/.config/raycast/workspaces/catalog.json',import.meta.url)));
const local={layouts:{cs:{laptop:'raycast://example?name=Code',desk:'raycast://example?name=CodeDesk'}}};
const request={id:'cs',action:'focus'};
test('one standalone Session command routes dropdown choices and rejects unsupported input without launching',()=>{
 const script=fileURLToPath(new URL('../raycast/.config/raycast/scripts/start-focus-session.sh',import.meta.url));
 const preview=(category,minutes)=>execFileSync('/bin/bash',[script,category,minutes,'--preview'],{encoding:'utf8'}).trim();
 assert.equal(preview('',''),'session:///start?categoryName=Work&duration=45');
 for(const category of ['Work','Code','Author','Design','Innovate','Zen'])for(const minutes of ['25','30','45']){
  const url=new URL(preview(category,minutes));
  assert.equal(url.protocol,'session:');assert.equal(url.pathname,'/start');
  assert.equal(url.searchParams.get('categoryName'),category);assert.equal(url.searchParams.get('duration'),minutes);
 }
 for(const [category,minutes] of [['Unknown','45'],['Work','60'],['Work','45;open bad']]){
  const result=spawnSync('/bin/bash',[script,category,minutes,'--preview'],{encoding:'utf8'});
  assert.equal(result.status,2);assert.equal(result.stdout,'');
 }
});
test('all fifteen variants keep forty-five unique three-character aliases and fifteen keys',()=>{
 const aliases=catalog.variants.flatMap(v=>Object.values(v.aliases));
 assert.equal(catalog.variants.length,15);assert.equal(new Set(aliases).size,45);
 assert.ok(aliases.every(a=>/^[a-z0-9]{3}$/.test(a)));
 assert.equal(new Set(catalog.variants.map(v=>v.hotkey)).size,15);
 for(const [id,key] of Object.entries({as:'a',cs:'x'}))assert.equal(catalog.variants.find(v=>v.id===id).hotkey,'control+option+'+key);
 assert.equal(catalog.variants.find(v=>v.id==='ws').hotkey,'control+option+shift+o');
 assert.equal(new Set(catalog.variants.map(v=>v.workflow)).size,9);
 const layouts=JSON.parse(readFileSync(new URL('../raycast/.config/raycast/workspaces/reference.json',import.meta.url))).nativeLayouts;
 const allAliases=[...aliases,...layouts.map(v=>v.alias)];
 assert.equal(layouts.length,30);
 assert.equal(new Set(allAliases).size,75);
 for(const v of catalog.variants){
  assert.equal(layouts.find(l=>l.variant===v.id&&l.profile==='laptop').alias,v.aliases.layout+'l');
  assert.equal(layouts.find(l=>l.variant===v.id&&l.profile==='desk').alias,v.aliases.layout+'d');
 }
});
test('default is 45, with exactly 25/30/45 accepted',()=>{
 assert.equal(workspacePlan(catalog,local,request,[1]).minutes,45);
 for(const minutes of [25,30,45])assert.equal(workspacePlan(catalog,local,{...request,minutes},[1]).minutes,minutes);
 for(const minutes of [0,20,60,'45;open bad'])assert.throws(()=>workspacePlan(catalog,local,{...request,minutes},[1]),/Duration/);
});
test('display choice handles closed lid, two displays and calibrated multi-display desks',()=>{
 assert.equal(workspacePlan(catalog,local,request,[8]).profile,'laptop');
 assert.equal(workspacePlan(catalog,local,request,[8,9]).profile,'desk');
 assert.throws(()=>workspacePlan(catalog,local,request,[1,8,9]),/Choose Laptop/);
 assert.equal(workspacePlan(catalog,{...local,deskScreenIds:[8,9]},request,[1,8,9]).profile,'desk');
 assert.throws(()=>workspacePlan(catalog,local,{...request,profile:'desk'},[1]),/two active/);
});
test('exact apps: Zed Zen Code, both remote clients, user-confirmed ChatGPT identity, minimized Code Notion',()=>{
 const v=id=>catalog.variants.find(v=>v.id===id);
 assert.deepEqual(v('zc').apps,['zed','ghostty','canary','notion']);
 assert.equal(v('zc').title,'Zen Code');assert.equal(v('zc').aliases.workspace,'wzc');
 assert.deepEqual(v('rw').apps,['windows','citrix']);
 assert.deepEqual(v('iv').apps,['cursor','ghostty','canary','chatgpt']);
 assert.ok(!catalog.apps.chrome);
 assert.ok(!catalog.apps.obsidian);
 assert.deepEqual(catalog.apps.notion.bundleIds,['notion.id']);
 assert.ok(catalog.variants.every(v=>!JSON.stringify(v).includes('obsidian')));
 assert.deepEqual(catalog.apps.chatgpt.bundleIds,['com.openai.codex']);
 for(const variant of catalog.variants.filter(v=>v.workflow==='code'))assert.deepEqual(variant.minimize,['notion']);
 for(const id of ['as']){
  assert.ok(v(id).apps.includes('ghostty'));
  assert.deepEqual(v(id).layouts.desk.filter(e=>e.screen==='support').map(e=>[e.app,e.widthPercent,e.position]),[['zen',66.6667,'top-left'],['ghostty',33.3333,'top-right']]);
 }
 assert.equal(v('df').urls[0].url,'https://mobbin.com/discover/apps/web/latest');
});
function fake({fail,confirm=true,remote=false}={}){
 const calls=[];const p={remoteWasRunning:remote};
 for(const k of ['preflight','applyDock','openApps','openLayout','openURLs','minimizeApps','openSession'])p[k]=()=>{calls.push(k);if(fail===k)throw new Error('failed '+k);};
 p.confirmTimer=()=>{calls.push('confirmTimer');return confirm;};return {p,calls};
}
test('focus orders Dock, layout and readiness confirmation before a single timer request',()=>{
 const {p,calls}=fake();executeWorkspace(workspacePlan(catalog,local,request,[1]),p);
 assert.deepEqual(calls,['preflight','applyDock','openApps','openLayout','openURLs','minimizeApps','confirmTimer','minimizeApps','openSession']);
});
test('preflight and later failures/cancel never request a timer',()=>{
 for(const fail of ['preflight','applyDock','openLayout','minimizeApps']){
  const {p,calls}=fake({fail});assert.throws(()=>executeWorkspace(workspacePlan(catalog,local,request,[1]),p));
  assert.ok(!calls.includes('openSession'));if(fail==='preflight')assert.deepEqual(calls,['preflight']);
 }
 const {p,calls}=fake({confirm:false});assert.equal(executeWorkspace(workspacePlan(catalog,local,request,[1]),p).timerRequested,false);assert.ok(!calls.includes('openSession'));
});
test('workspace and layout actions never touch timers; layout never changes Dock',()=>{
 for(const action of ['workspace','layout']){
  const {p,calls}=fake();executeWorkspace(workspacePlan(catalog,local,{...request,action},[1]),p);
  assert.ok(!calls.includes('confirmTimer'));assert.ok(!calls.includes('openSession'));
  assert.equal(calls.includes('applyDock'),action==='workspace');
 }
});
test('already-open remote clients are opened without reapplying their layout',()=>{
 const {p,calls}=fake({remote:true});const plan=workspacePlan(catalog,{},{id:'rw',action:'workspace'},[1]);
 assert.equal(executeWorkspace(plan,p).status,'remote_clients_opened_layout_preserved');assert.ok(!calls.includes('openLayout'));
});
test('local app overrides and invalid layout links are handled without shell evaluation',()=>{
 const p=workspacePlan(catalog,{...local,apps:{chatgpt:'com.openai.chat'}},{id:'iv',action:'focus'},[1]);
 assert.deepEqual(p.apps.find(a=>a.id==='chatgpt').bundleIds,['com.openai.chat']);
 assert.throws(()=>workspacePlan(catalog,{layouts:{cs:{laptop:'https://wrong.example'}}},request,[1]),/Raycast deeplink/);
});

test('chat sits beside the primary coding/design app; lone support browsers fill their display',()=>{
 for(const v of catalog.variants.filter(v=>v.workflow==='code')){
  for(const profile of ['laptop','desk']){
   const rows=v.layouts[profile];
   assert.equal(rows[0].widthPercent,66.6667);
   assert.equal(rows[1].app,'slack');assert.equal(rows[1].widthPercent,33.3333);
  }
 }
 for(const v of catalog.variants.filter(v=>v.workflow==='design')){
  assert.deepEqual(v.layouts.laptop.map(r=>r.widthPercent),[66.6667,33.3333]);
  assert.deepEqual(v.layouts.desk.map(r=>r.widthPercent),[100,100]);
 }
 for(const v of catalog.variants.filter(v=>v.workflow==='meet')){
  assert.deepEqual(v.apps,v.id==='mt'?['teams','notion','edge']:['zoom','notion','zen']);
  for(const rows of Object.values(v.layouts))assert.deepEqual(rows.map(r=>r.widthPercent),[66.6667,33.3333,100]);
  assert.ok(!JSON.stringify(v.layouts).includes('wispr'));
 }
 assert.ok(!catalog.apps.discord && !catalog.apps.granola);
 assert.ok(catalog.variants.every(v=>!JSON.stringify(v).match(/discord|granola/i)));

});

test('focus minimizes a window revealed during readiness and stops if the final minimization fails',()=>{
 for(const finalFailure of [false,true]){
  let visible=false,started=false,minimizations=0;
  const {p}=fake();
  p.minimizeApps=()=>{minimizations++;if(finalFailure&&minimizations===2)throw Error('window could not minimize');visible=false;};
  p.confirmTimer=()=>{visible=true;return true;};
  p.openSession=()=>{assert.equal(visible,false);started=true;};
  const run=()=>executeWorkspace(workspacePlan(catalog,local,request,[1]),p);
  if(finalFailure)assert.throws(run,/could not minimize/);else run();
  assert.equal(started,!finalFailure);assert.equal(minimizations,2);
 }
});
