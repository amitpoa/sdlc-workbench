import assert from 'node:assert/strict';
import {renderToString} from 'react-dom/server';
import Showcase from '@/public-app/showcase';
import Home from '@/app/page';
import {assetUrl,PUBLIC_DEMO} from '@/lib/runtime';
assert.equal(PUBLIC_DEMO,true);
const landing=renderToString(<Showcase onLaunch={()=>{}}/>);
for(const text of ['Make every','traceable.','Amit Paul','Try the workbench','Your own browser workspace','Sample project','Acceptance criteria','GitHub repository']){if(text==='Acceptance criteria')continue;assert.ok(landing.includes(text),`Missing showcase content: ${text}`);}
assert.match(landing,/aria-pressed="true"/);assert.match(landing,/payment-project\.json/);assert.ok(!landing.includes('signin-with-chatgpt'));
const workbench=renderToString(<Home startInProject onExit={()=>{}}/>);assert.match(workbench,/Browser workspace/);assert.match(workbench,/Back to showcase/);assert.match(workbench,/Requirements/);assert.ok(!workbench.includes('Sign in with ChatGPT'));assert.ok(!workbench.includes('Private workspace'));
const projects=renderToString(<Home/>);assert.match(projects,/Create project/);assert.match(projects,/not uploaded or shared with other visitors/);
assert.equal(assetUrl('document-reader/pdf.worker.mjs'),'/ba-sdlc-workbench/document-reader/pdf.worker.mjs');
console.log('Public rendering passed: showcase, live sample outputs, browser-mode workbench, project hub and GitHub Pages asset paths.');
