import assert from 'node:assert/strict';
import { sampleProjects, createProject, selectProject, updateActiveProject, emptyProject, features, epics, stories, addFeature, saveFeature, addSplitStory, saveStory, analyzeProject, impact, linkedAreas, documentMarkdown, exportWorkspace, restoreWorkspace, exportProjects, restoreProjects, graphFor, updateRequirement } from '../lib/workbench.ts';

let all=sampleProjects();const original=JSON.stringify(all.projects[0]);
all=createProject(all,'Career Hub employment');const careerId=all.activeId;
let w=all.projects.find(p=>p.id===careerId).workbench;
assert.equal(w.requirements.length,0);assert.deepEqual(features(w),[]);assert.deepEqual(stories(w),[]);assert.deepEqual(graphFor(w),{nodes:[],edges:[]});
assert.doesNotThrow(()=>documentMarkdown(w));assert.deepEqual(restoreWorkspace(exportWorkspace(w)),{...w,graph:graphFor(w)});

w=addFeature(w,'Feature','Counselling booking','CH-10');const feature=features(w)[0];
w=addSplitStory(w,feature.id,'','Book a counselling session');
w=addSplitStory(w,feature.id,'','Cancel a counselling session');
assert.equal(features(w).length,1);assert.equal(epics(w).length,0);assert.equal(stories(w).length,2);
assert.deepEqual(stories(w).map(s=>s.number),['1.1','1.2']);assert.ok(stories(w).every(s=>s.featureId===feature.id&&s.requirementId===''));
let first=stories(w)[0];
w=saveStory(w,first.id,{...first,actor:'Participant',goal:'book an available counselling session',benefit:'receive career guidance',journey:['Select a service','Choose an available slot','Confirm the booking'],requirements:['Only available slots can be booked.'],criteria:['Given an available slot, when I confirm, then the booking is created.']});
assert.match(documentMarkdown(w),/As a Participant, I want to book an available counselling session/);
assert.ok(documentMarkdown(w).includes('Not linked'));assert.ok(!documentMarkdown(w).includes('Parent Epic:'));

w=analyzeProject(w,w.title,'A Participant can book an available counselling session.\nOnly an available counselling slot may be booked.');
assert.equal(stories(w).length,2,'Adding evidence preserves the manually created stories without generating others');
assert.equal(features(w).length,1);first=stories(w)[0];assert.equal(first.requirementId,'');
w=saveStory(w,first.id,{...first,requirementId:'BR-01'});
const plan=impact(w,'BR-01','A Participant can book an available counselling session after completing their profile.');
assert.ok(plan.rows.some(r=>r.id===first.id));assert.ok(plan.rows.some(r=>r.id===feature.id&&r.kind==='Feature'));
assert.ok(!plan.rows.some(r=>r.kind==='Epic'));assert.deepEqual(linkedAreas(w,['BR-01']).epics,[]);
w=updateRequirement(w,'BR-01',{text:plan.after});assert.equal(stories(w)[0].needsReview,true);
all=updateActiveProject(all,w);assert.equal(JSON.stringify(all.projects[0]),original,'Another project remains untouched');

all=createProject(all,'University finance');const financeId=all.activeId;
let finance=all.projects.find(p=>p.id===financeId).workbench;
finance=addFeature(finance,'Epic','Payment approvals');const epic=features(finance)[0];
finance=addSplitStory(finance,epic.id,'','Approve a payment request');
finance=addSplitStory(finance,epic.id,'','Reject a payment request');
assert.equal(features(finance).length,1);assert.equal(epics(finance).length,1);assert.ok(stories(finance).every(s=>s.epicId===epic.id));
finance=analyzeProject(finance,finance.title,'A Finance Checker can approve or reject a submitted payment request.');
finance=saveStory(finance,stories(finance)[0].id,{...stories(finance)[0],requirementId:'BR-01',actor:'Finance Checker',goal:'approve a payment request',benefit:'confirm a valid payment',criteria:['Given a valid request, when approved, then its approval is recorded.']});
assert.ok(impact(finance,'BR-01','A Finance Checker can approve or reject a submitted payment request with a decision reason.').rows.some(r=>r.id===epic.id&&r.kind==='Epic'));
assert.deepEqual(linkedAreas(finance,['BR-01']).epics,[epic.id]);assert.deepEqual(linkedAreas(finance,['BR-01']).features,[]);
finance=saveFeature(finance,epic.id,'Payment review','FIN-10','Feature');
assert.equal(epics(finance).length,0);assert.ok(stories(finance).every(s=>s.featureId===epic.id&&s.epicId===''));
all=updateActiveProject(all,finance);all=selectProject(all,careerId);
assert.equal(all.projects.find(p=>p.id===all.activeId).workbench.title,'Career Hub employment');
assert.equal(stories(all.projects.find(p=>p.id===financeId).workbench).length,2);
assert.deepEqual(restoreProjects(exportProjects(all)),JSON.parse(exportProjects(all)).collection);

const old=sampleProjects().projects[0].workbench;
old.features=[{id:'F01',epicId:'EP-01',title:'Legacy request intake',jiraId:'TBD'},{id:'F02',epicId:'EP-02',title:'Legacy validation',jiraId:'TBD'},{id:'F03',epicId:'EP-03',title:'Legacy review',jiraId:'TBD'},{id:'F04',epicId:'EP-04',title:'Legacy audit',jiraId:'TBD'}];
const restored=restoreProjects(exportWorkspace(old));assert.equal(restored.projects.length,1);assert.equal(stories(restored.projects[0].workbench).length,8);assert.equal(features(restored.projects[0].workbench)[2].kind,'Feature');
assert.doesNotThrow(()=>documentMarkdown(restored.projects[0].workbench));
assert.throws(()=>emptyProject(' '),/project name/);assert.throws(()=>addFeature(w,'missing','Name'),/Feature or Epic/);assert.throws(()=>addSplitStory(w,'missing','','Story'),/feature or epic/);
assert.throws(()=>saveStory(w,first.id,{...stories(w)[0],requirementId:'missing'}),/source requirement/);
const broken=JSON.parse(exportProjects(all));broken.collection.activeId='missing';assert.throws(()=>restoreProjects(JSON.stringify(broken)),/valid Trace projects/);
const brokenKind=JSON.parse(exportWorkspace(finance));brokenKind.workbench.features[0].kind='Other';assert.throws(()=>restoreWorkspace(JSON.stringify(brokenKind)),/hierarchy/);
assert.throws(()=>restoreWorkspace(JSON.stringify({format:'trace-workspace-v1',workbench:{...w,extraStories:[...w.extraStories,{...w.extraStories[0]}]}})),/split stories/);
console.log('Project flow passed: empty creation, feature-first and epic-first stories, optional evidence, source linking, isolation, switching, type changes, SRS export, legacy import, and collection round-trip.');
