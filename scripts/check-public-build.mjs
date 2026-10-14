import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
const root=resolve(import.meta.dirname,'..'),dist=join(root,'public-dist');
function walk(path){return readdirSync(path).flatMap(name=>statSync(join(path,name)).isDirectory()?walk(join(path,name)):[join(path,name)]);}
const files=walk(dist),javascript=files.filter(f=>f.endsWith('.js')).map(f=>readFileSync(f,'utf8')).join('\n');
for(const forbidden of ['/api/workbench','/api/projects','signin-with-chatgpt','appgprj_','ba-sdlc-workbench.amitpaul-ac.chatgpt.site'])assert.ok(!javascript.includes(forbidden),`Public JavaScript contains a private dependency: ${forbidden}`);
for(const required of ['index.html','favicon.svg','public-use-guide.md','samples/payment-project.json','samples/payment-requirements.md','samples/sample-SRS.md','document-reader/pdf.mjs','document-reader/pdf.worker.mjs','document-reader/jszip.min.js'])assert.ok(existsSync(join(dist,required)),`Missing public asset ${required}`);
assert.ok(!existsSync(join(dist,'live-use-guide.md')));assert.ok(!existsSync(join(dist,'showcase')));assert.ok(!existsSync(join(dist,'.openai')));
const html=readFileSync(join(dist,'index.html'),'utf8');assert.match(html,/Content-Security-Policy/);for(const path of [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css|svg))"/g)].map(m=>m[1])){const marker=path.indexOf('/assets/');const local=path.startsWith('./')?path.slice(2):marker>=0?path.slice(marker+1):path.split('/').at(-1);assert.ok(existsSync(join(dist,local)),`Broken static path ${path}`);}
console.log('Public build passed: required assets, CSP, root/subpath links and no private APIs, sign-in, Site identity or private guide.');
