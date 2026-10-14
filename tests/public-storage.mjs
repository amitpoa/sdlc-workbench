import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync,readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const require=createRequire(import.meta.url),viteRequire=createRequire(require.resolve('vite/package.json'));
let esbuild;try{esbuild=require('esbuild');}catch{esbuild=viteRequire('esbuild');}
const root=resolve(import.meta.dirname,'..'),file=resolve(root,'.sites-runtime/public-storage.cjs');mkdirSync(resolve(root,'.sites-runtime'),{recursive:true});
await esbuild.build({entryPoints:[resolve(root,'lib/browser-store.ts')],outfile:file,bundle:true,platform:'node',format:'cjs'});
const {createCollectionStore,browserScope,checkLocalFile,assertFileCapacity,storeOriginal}=require(file);
const {sampleProjects,createProject,deleteProjectFromCollection,restoreProjects,exportProjects}=await import('../lib/workbench.ts');
function memory(){const map=new Map();return {getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value),map};}
const disk=memory(),key=browserScope('https://amitpoa.github.io/ba-workbench/index.html#workbench'),store=createCollectionStore(disk,key);
assert.equal(key,browserScope('https://amitpoa.github.io/ba-workbench/'));assert.notEqual(key,browserScope('https://amitpoa.github.io/another-project/'));
assert.equal(store.read().collection,null);let collection=sampleProjects(),raw=store.save(collection,null);assert.deepEqual(store.read().collection,collection);
const changed=createProject(collection,'Browser project');const newer=store.save(changed,raw);assert.throws(()=>store.save(collection,raw),/Another tab/);assert.deepEqual(store.read().collection,changed);
let removed=deleteProjectFromCollection(changed,changed.activeId);const withNew=createProject(removed,'Replacement project');assert.deepEqual(withNew.pendingProjectDeletes,removed.pendingProjectDeletes,'Creating a project must preserve cleanup retries');
let empty=changed;for(const project of [...empty.projects])empty=deleteProjectFromCollection(empty,project.id);store.save(empty,newer);assert.equal(store.read().collection.activeId,'');assert.equal(store.read().collection.projects.length,0);assert.deepEqual(restoreProjects(exportProjects(empty)),empty);
const another=createCollectionStore(disk,browserScope('https://amitpoa.github.io/another-project/'));assert.equal(another.read().collection,null);another.save(sampleProjects(),null);assert.equal(store.read().collection.projects.length,0);
const otherBrowser=createCollectionStore(memory(),key);assert.equal(otherBrowser.read().collection,null);
const blocked=createCollectionStore({getItem:()=>null,setItem:()=>{throw new Error('Quota');}},'blocked');assert.throws(()=>blocked.save(collection,null),/storage is full or unavailable/);
disk.map.set('corrupt','invalid JSON');assert.throws(()=>createCollectionStore(disk,'corrupt').read());assert.equal(disk.map.get('corrupt'),'invalid JSON','A failed read must not overwrite original stored data');
assert.equal(checkLocalFile({name:'diagram.XAML',size:25}).mime,'text/plain');assert.equal(checkLocalFile({name:'image.PNG',size:25}).mime,'image/png');assert.throws(()=>checkLocalFile({name:'script.html',size:12}),/supported Office/);assert.throws(()=>checkLocalFile({name:'large.pdf',size:5*1024*1024+1}),/5 MB/);
assert.throws(()=>assertFileCapacity(Array.from({length:20},()=>({size:1})),1),/20 original/);assert.throws(()=>assertFileCapacity([{size:50*1024*1024}],1),/50 MB/);
globalThis.document={baseURI:'https://amitpoa.github.io/ba-workbench/'};globalThis.window={localStorage:memory()};
const currentStore=createCollectionStore(window.localStorage,key);currentStore.save(sampleProjects(),null);
await assert.rejects(()=>storeOriginal('PRJ-999',{name:'file.md',size:4}),/Save the project/);await assert.rejects(()=>storeOriginal('PRJ-001',{name:'file.md',size:4}),/cannot store original/);
delete globalThis.document;delete globalThis.window;
const sample=readFileSync(resolve(root,'public/samples/payment-project.json'),'utf8');assert.equal(restoreProjects(sample).projects.length,1);
console.log('Public storage passed: saved reload, per-path/browser isolation, conflict and quota recovery, corrupt-data preservation, empty projects, cleanup markers, file limits, and sample import. IndexedDB browser interaction remains unverified.');
