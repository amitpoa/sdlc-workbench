import assert from 'node:assert/strict';
import { renderToString } from 'react-dom/server';
import Showcase, { JourneyPreview, ChangePreview, journeyStages } from '@/public-app/showcase';
import WorkbenchEntry from '@/public-app/workbench-entry';
import Home from '@/app/page';
import { assetUrl, PUBLIC_DEMO } from '@/lib/runtime';

assert.equal(PUBLIC_DEMO, true);
const landing = renderToString(<Showcase onLaunch={() => {}}/>);
for (const text of ['From requirements', 'shared clarity.', 'Amit Paul', 'Open workbench', 'Your own browser workspace', 'Sample project', 'Starts at Projects', 'Reset example']) {
  assert.ok(landing.includes(text), `Missing showcase content: ${text}`);
}
assert.match(landing, /aria-pressed="true"/);
assert.match(landing, /payment-project\.json/);
assert.ok(!landing.includes('signin-with-chatgpt'));
const stageContent = ['Linked to source SRC-05', 'Approve or reject', 'Acceptance criteria', 'Source traceability', 'SRS content'];
journeyStages.forEach((stage, i) => {
  const rendered = renderToString(<JourneyPreview stage={stage.id} onSelect={() => {}}/>);
  assert.ok(rendered.includes(stageContent[i]), `Missing preview for ${stage.id}`);
  assert.equal((rendered.match(/aria-pressed="true"/g) || []).length, 1);
  assert.match(rendered, /aria-live="polite"/);
});
const baseline = renderToString(<ChangePreview changed={false} onChange={() => {}} view="impact" onView={() => {}}/>);
const proposed = renderToString(<ChangePreview changed onChange={() => {}} view="impact" onView={() => {}}/>);
assert.ok(baseline.includes('What this change would affect'));
assert.ok(!baseline.includes('Pending · Unpaid'));
assert.ok(proposed.includes('Ready for impact review'));
assert.ok(proposed.includes('Pending · Unpaid'));
assert.ok(proposed.includes('Finance Head'));
const draft = renderToString(<ChangePreview changed onChange={() => {}} view="story" onView={() => {}}/>);
assert.match(draft, /Acceptance criteria/);
assert.match(draft, /Sources:/);

// Render the exact entry component used by the public hash route. A sample may
// be listed as a card, but its active analysis screen must not open on entry.
const projects = renderToString(<WorkbenchEntry onExit={() => {}}/>);
assert.match(projects, /<h1 id="project-hub-title" tabindex="-1">Projects<\/h1>/);
assert.match(projects, /Create project/);
assert.match(projects, /Open project/);
assert.match(projects, /Back to showcase/);
assert.match(projects, /not uploaded or shared with other visitors/);
assert.ok(!projects.includes('class="stage-heading"'));
assert.ok(!projects.includes('class="project-tools"'));
const workbench = renderToString(<Home startInProject onExit={() => {}}/>);
assert.match(workbench, /Browser workspace/);
assert.match(workbench, /Requirements/);
assert.ok(!workbench.includes('Sign in with ChatGPT'));
assert.ok(!workbench.includes('Private workspace'));
assert.ok(!workbench.includes('Private cloud saving'));
assert.equal(assetUrl('document-reader/pdf.worker.mjs'), '/ba-sdlc-workbench/document-reader/pdf.worker.mjs');
console.log('Public rendering passed: five journey previews, baseline/proposed impact and story states, project-first public entry, internal workbench and subpath assets. Browser interactions remain unverified.');
