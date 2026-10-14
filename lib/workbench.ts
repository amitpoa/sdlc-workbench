export type Source = { id: string; title: string; text: string };
export type Requirement = { id: string; title: string; text: string; role: string; category: string; sourceIds: string[]; priority: string; reviewed: boolean };
export type StoryContent = { title:string; jiraId:string; featureId:string; actor:string; goal:string; benefit:string; narrative:string; journey:string[]; actors:string[]; scope:string[]; preconditions:string[]; impactedAreas:string[]; prototypes:string; requirements:string[]; criteria:string[]; exceptions:string[] };
export type Story = StoryContent & { id:string; requirementId:string; sourceRequirementIds:string[]; workflowNodeIds:string[]; flowSignature?:string; flowSuggestionKey?:string; epicId:string; number:string; needsReview:boolean };
export type StoryEdit = Partial<StoryContent> & { needsReview?:boolean; requirementId?:string; sourceRequirementIds?:string[]; workflowNodeIds?:string[]; flowSignature?:string; flowSuggestionKey?:string };
// epicId retains the source grouping in older exports; it is not a required parent.
export type Feature = { id:string; epicId:string; title:string; jiraId:string; kind?:'Feature'|'Epic' };
export type ExtraStory = StoryEdit & { id:string; requirementId:string; featureId:string; title:string };
export type SrsMeta = { version:string; revisionDate:string; changeDescription:string; affectedSections:string; crId:string; jiraId:string; createdBy:string; creatorTitle:string; reviewedBy:string; reviewerTitle:string; approvedBy:string; purpose:string; users:string[]; inScope:string[]; outOfScope:string[]; risks:{risk:string;level:string;likelihood:string;mitigation:string}[]; effort:{item:string;days:string}[]; initiatedBy:string; initiatedOn:string; crType:string; crCategory:string; accumulation:string; note:string };
export type GraphKind='step'|'decision'|'initial'|'final'|'fork'|'join'|'merge';
export type GraphNode = { id:string; label:string; role:string; refs:string[]; x:number; y:number; kind:GraphKind; needsReview?:boolean };
export type GraphEdge = { id:string; from:string; to:string; label:string };
export type WorkflowGraph = { nodes:GraphNode[]; edges:GraphEdge[]; lanes?:{role:string;y:number;height:number}[] };
export type MeetingOutcome = { id:string; kind:'Decision'|'Action'|'Open question'; text:string; requirementIds:string[] };
export type KnowledgeItem={id:string;fileId?:string;name:string;mime:string;size:number;text:string;notes:string;addedAt:string};
export type Relation={id:string;from:string;to:string;type:'relates to'|'depends on'|'blocks'|'supports';note:string};
export type Workbench = { deletedStoryIds?:string[]; knowledge?:KnowledgeItem[]; relations?:Relation[]; relationPositions?:Record<string,{x:number;y:number}>; autoStories?:boolean; graph?:WorkflowGraph; outcomes?:MeetingOutcome[]; importedFrom?:string; title: string; revision: number; sources: Source[]; requirements: Requirement[]; features?:Feature[]; extraStories?:ExtraStory[]; srs?:SrsMeta; storyEdits: Record<string, StoryEdit>; questions: string[]; changes: { id: string; requirementId: string; before: string; after: string }[] };
export const SAMPLE_TITLE = 'Payment approval';
export const SAMPLE_INPUT = `A Finance Maker can search for an unpaid payslip and submit a Mark as Paid request. Paid payslips cannot be submitted again.
Payment method and payment date are mandatory before a request is submitted. A payment date must be a valid calendar date.
For a payslip amount greater than zero, payment method lists bank names only. For a zero amount, it lists Previous Advance, Scholarship & Waiver, and Semester Drop.
A duplicate transaction ID for the same bank must be blocked before submission, with a failure recorded in the audit log.
A Finance Checker can approve or reject a submitted request. The Maker cannot approve their own request.
A payslip becomes Paid only after the required approval is complete. Until then, its payment status remains Unpaid.
A rejected request remains Unpaid and returns to the Maker for correction and resubmission. A rejection reason is mandatory.
The system records submissions, approval decisions, and validation failures with the actor, timestamp, payslip number, and changed values in an audit log.`;
export const SAMPLE_CHANGE = 'A Finance Checker can approve or reject a submitted request. For a payslip amount greater than 50,000 BDT, Finance Head approval is also required after Checker approval. The Maker cannot approve their own request.';
const categories = ['Request intake', 'Validation & controls', 'Approval & status', 'Audit & governance'];
const stop = new Set('a an the and or for to of in on is are be can must with only before after as it their this that what how who when does do required request system'.split(' '));
export function tokens(s: string) { return (s.toLowerCase().match(/[a-z0-9]+/g) || []).map(x => x.replace(/(ing|ed|s)$/,'')).filter(x => x.length > 2 && !stop.has(x)); }
export function retrieve(query: string, sources: Source[], limit = 3) {
 const q = [...new Set(tokens(query))];
 const matches = sources.map(s => { const t=tokens(s.text); const set=new Set(t); const matched=q.filter(x=>set.has(x)); const score=matched.reduce((v,x)=> v + Math.log(1+sources.length/(1+sources.filter(y=>tokens(y.text).includes(x)).length)),0)/Math.sqrt(Math.max(1,t.length)); return {...s,score,matched}; });
 return matches.filter(x=>x.matched.length>0).sort((a,b)=>b.score-a.score).slice(0,limit);
}
function classify(text: string) {
 if(/audit|timestamp|log/i.test(text) && !/duplicate/i.test(text)) return categories[3];
 if(/approv|reject|paid only|until then/i.test(text)) return categories[2];
 if(/mandatory|valid|duplicate|amount|method/i.test(text)) return categories[1];
 return categories[0];
}
function role(text: string) { if(!/finance|payment|payslip|checker|maker/i.test(text)){const match=text.match(/^(?:A|An|The)\s+(.{2,40}?)\s+(?:can|must|shall|should|may|will)\b/i);return match?match[1]:'Business user';} return /checker|approv|reject/i.test(text)?'Finance Checker':/maker/i.test(text)?'Finance Maker':'Finance Officer'; }
function title(text: string) { const first=text.split(/[.!?]/)[0].trim(); return first.length>78?first.slice(0,75)+'…':first; }
export function analyze(titleText: string, text: string): Workbench {
 const lines=text.split(/\n+/).map(x=>x.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim()).filter(Boolean);
 if(!titleText.trim()) throw new Error('Add a project name.');
 if(!lines.length) throw new Error('Add at least one business requirement.');
 if(lines.length>30) throw new Error('Use up to 30 requirement paragraphs in this prototype.');
 if(text.length>20000) throw new Error('Keep the input below 20,000 characters.');
 const sources=lines.map((text,i)=>({id:`SRC-${String(i+1).padStart(2,'0')}`,title:`Business brief · paragraph ${i+1}`,text}));
 const requirements=sources.map((s,i)=>({id:`BR-${String(i+1).padStart(2,'0')}`,title:title(s.text),text:s.text,role:role(s.text),category:classify(s.text),sourceIds:[s.id],priority:'Must',reviewed:false}));
 return {title:titleText.trim(),revision:1,sources,requirements,storyEdits:{},questions:/payslip|payment/i.test(text)?['What is the approval turnaround time?','Are backdated payment dates permitted?','Who can view the audit log, and how long is it retained?']:['Who owns each business rule?','Which exception paths and constraints apply?','What are the acceptance and completion criteria?'],changes:[]};
}
export function sample() { return analyze(SAMPLE_TITLE,SAMPLE_INPUT); }
function requirementGroups(w:Workbench) { return categories.map((name,i)=>({id:`EP-${String(i+1).padStart(2,'0')}`,name,requirements:w.requirements.filter(r=>r.category===name)})).filter(x=>x.requirements.length); }
export function epics(w:Workbench) { const ss=stories(w);return features(w).filter(f=>f.kind==='Epic').map(f=>({id:f.id,name:f.title,requirements:w.requirements.filter(r=>ss.some(s=>s.featureId===f.id&&s.requirementId===r.id))})); }
function acceptance(r:Requirement) {
 const t=r.text;
 const out=[`Given an authorized ${r.role}, when this capability is used, then the following rule is enforced: ${t}`];
 if(/mandatory/i.test(t))out.push('Given a required field is missing, when the user submits, then submission is blocked and the missing field is identified.');
 if(/duplicate/i.test(t)&&/bank/i.test(t)&&/transaction/i.test(t))out.push('Given an existing bank and transaction ID pair, when the same pair is submitted again, then no duplicate request is created and the failure is logged.');
 if(/greater than zero/i.test(t)&&/Previous Advance/i.test(t))out.push('Given an amount of 0, then only Previous Advance, Scholarship & Waiver, and Semester Drop are offered; given an amount above 0, then only bank names are offered.');
 if(/cannot approve/i.test(t))out.push('Given the current user created the request, when they attempt to approve it, then approval is denied.');
 if(/50,000/.test(t)&&/Finance Head/i.test(t))out.push('Given an amount of exactly 50,000 BDT, Checker approval is sufficient; given 50,001 BDT, Finance Head approval is also required and status stays Unpaid until that approval.');
 if(/rejection reason/i.test(t))out.push('Given a rejection reason is empty, when Reject is selected, then rejection is blocked; with a reason, the request returns to the Maker and remains Unpaid.');
 if(/Paid only/i.test(t))out.push('Given an approval is still pending or the request is rejected, then the payslip must remain Unpaid.');
 return out;
}
export function features(w:Workbench):Feature[] {return w.features!==undefined?w.features.map(f=>({...f,kind:f.kind||'Feature'})):requirementGroups(w).map(e=>({id:`F${e.id.slice(-2)}`,epicId:e.id,kind:'Feature',title:w.requirements.some(r=>/payslip|payment/i.test(r.text))?({'EP-01':'Payslip request submission','EP-02':'Payment validation','EP-03':'Request review and payment status','EP-04':'Payment audit trail'}[e.id]||e.name):e.name,jiraId:'TBD'}));}
function draftGoal(r:Requirement){const t=r.text;let actor=r.role,goal=t.replace(/^(?:A|An|The)\s+.+?\s+(?:can|must|shall|should|may|will)\s+/i,'').split(/[.!?]/)[0];let benefit='complete the task according to the agreed business rules';
 if(/unpaid payslip.*submit/i.test(t)){actor='Finance Maker';goal='submit a Mark as Paid request for an unpaid payslip';benefit='request payment confirmation without resubmitting a paid payslip';}
 else if(/method and payment date are mandatory/i.test(t)){actor='Finance Maker';goal='provide a payment method and a valid payment date';benefit='submit a complete payment request';}
 else if(/payment method lists bank names/i.test(t)){actor='Finance Maker';goal='choose a payment method that matches the payslip amount';benefit='record the applicable bank payment or zero-amount adjustment';}
 else if(/duplicate transaction ID/i.test(t)){actor='Finance Maker';goal='have duplicate bank transactions blocked before submission';benefit='avoid creating duplicate payment requests';}
 else if(/Checker can approve/i.test(t)){actor='Finance Checker';goal='approve or reject a submitted payment request';benefit='control whether the request proceeds to completion';}
 else if(/Paid only/i.test(t)){actor='Finance Officer';goal='see a payslip marked Paid only after all required approvals';benefit='identify whether the approval process is complete';}
 else if(/rejected request remains/i.test(t)){actor='Finance Maker';goal='correct and resubmit a rejected request';benefit='continue the payment confirmation process';}
 else if(/audit log/i.test(t)){actor='Finance Officer';goal='have submissions, decisions, and validation failures recorded';benefit='trace the actor, timestamp, payslip, and changed values';}
 return {actor,goal:goal.charAt(0).toLowerCase()+goal.slice(1),benefit};}
export function stories(w:Workbench):Story[] {
 const ff=features(w),wf=graphFor(w);
 const seeds=(w.autoStories===false?[]:w.requirements).map((r,i)=>({id:`US-${String(i+1).padStart(2,'0')}`,requirementId:r.id,featureId:(ff.find(f=>f.epicId===requirementGroups(w).find(e=>e.requirements.some(x=>x.id===r.id))?.id)||ff[0])?.id||'',title:r.title})).filter(s=>!w.deletedStoryIds?.includes(s.id));
 const result=[...seeds,...(w.extraStories||[])].map(seed=>{
  const custom=w.extraStories?.find(x=>x.id===seed.id),edit={...custom,...w.storyEdits[seed.id]};
  const requirementId=edit.requirementId===undefined?seed.requirementId:edit.requirementId;
  const r=w.requirements.find(r=>r.id===requirementId),parent=edit.featureId===undefined?seed.featureId:edit.featureId,f=ff.find(f=>f.id===parent);
  const sourceRequirementIds=[...new Set([...(edit.sourceRequirementIds||[]),...(r?[r.id]:[])])].filter(id=>w.requirements.some(r=>r.id===id));const linked=wf.nodes.filter(n=>n.refs.some(id=>sourceRequirementIds.includes(id)));const workflowNodeIds=edit.workflowNodeIds||linked.map(n=>n.id);
  const g=r?draftGoal(r):{actor:'Business user',goal:'TBD — define one desired action',benefit:'TBD — define the user outcome'};
  const actor=edit.actor||g.actor,goal=edit.goal||g.goal,benefit=edit.benefit||g.benefit;
  return {id:seed.id,requirementId:r?.id||'',sourceRequirementIds,workflowNodeIds,flowSignature:edit.flowSignature,flowSuggestionKey:edit.flowSuggestionKey,epicId:f?.kind==='Epic'?f.id:'',featureId:f?.id||'',number:'',title:edit.title||seed.title,jiraId:edit.jiraId||'TBD',actor,goal,benefit,narrative:edit.narrative||`As a ${actor}, I want to ${goal}, so I can ${benefit}.`,journey:edit.journey||linked.map(n=>`${n.role}: ${n.label}`),actors:edit.actors||[...new Set([actor,...linked.map(n=>n.role)])],scope:edit.scope||(r?[`Business rule ${r.id}: ${r.title}`]:['TBD — define the story scope.']),preconditions:edit.preconditions||[/unpaid payslip/i.test(r?.text||'')?'The relevant payslip is Unpaid.':/submitted request/i.test(r?.text||'')?'A submitted request exists.':'TBD — confirm the starting state and access permissions.'],impactedAreas:edit.impactedAreas||['Pages: TBD — confirm impacted screens.','Reports: TBD — confirm impacted reports.',...linked.map(n=>`Workflow: ${n.id} — ${n.label}`)],prototypes:edit.prototypes||'TBD — attach a mock-up or enter a prototype URL.',requirements:edit.requirements||(r?[`${r.id}: ${r.text}`]:[]),criteria:edit.criteria||(r?acceptance(r):[]),exceptions:edit.exceptions||(r?.text||'').split(/(?<=[.!?])\s+/).filter(t=>/cannot|blocked|rejected|rejection|duplicate/i.test(t)),needsReview:edit.needsReview===true||!!edit.flowSignature&&edit.flowSignature!==flowSignature(w,workflowNodeIds,sourceRequirementIds)};
 });
 return result.map(s=>({...s,number:`${s.featureId?ff.findIndex(f=>f.id===s.featureId)+1:'P'}.${result.filter(t=>t.featureId===s.featureId).findIndex(t=>t.id===s.id)+1}`}));
}

function suggestedWorkflow(w:Workbench) {
 if(!w.requirements.some(r=>/payslip|payment/i.test(r.text)))return {nodes:w.requirements.map((r,i)=>({id:`WF-${String(i+1).padStart(2,'0')}`,role:r.role,label:r.title,refs:[r.id]})),hasHead:false,threshold:null,branches:[] as {from:string;condition:string;to:string;refs:string[]}[],scopeNote:'Suggested steps follow document order. Arrange, connect, and refine them with stakeholders; process sequencing requires BA review.'};
 const links=(pattern:RegExp)=>w.requirements.filter(r=>pattern.test(r.text)).map(r=>r.id);
 const text=w.requirements.map(r=>r.text).join(' '); const hasHead=/Finance Head/i.test(text);const headRule=w.requirements.find(r=>/Finance Head/i.test(r.text));const thresholdMatch=headRule?.text.match(/(?:greater than|above|over|>)\s*([0-9][0-9,]*)/i);const threshold=thresholdMatch?Number(thresholdMatch[1].replace(/,/g,'')):null;const thresholdLabel=threshold!==null?threshold.toLocaleString('en-US'):'unspecified';
 const nodes=[{id:'WF-01',role:'Finance Maker',label:'Search unpaid payslip',refs:links(/search|unpaid payslip/i)},{id:'WF-02',role:'System',label:'Validate fields & duplicate transaction',refs:links(/mandatory|duplicate|method/i)},{id:'WF-03',role:'Finance Maker',label:'Submit request',refs:links(/submit/i)},{id:'WF-04',role:'Finance Checker',label:'Review request',refs:links(/Checker|reject/i)}];
 if(hasHead)nodes.push({id:'WF-05',role:'Finance Head',label:threshold!==null?`Additional approval for amount > ${thresholdLabel} BDT`:'Finance Head approval · threshold needs review',refs:links(/Finance Head/i)});
 nodes.push({id:hasHead?'WF-06':'WF-05',role:'System',label:'Mark Paid after all required approvals',refs:links(/Paid only|approval is complete/i)});
 nodes.push({id:hasHead?'WF-07':'WF-06',role:'System',label:'Record decision in audit log',refs:links(/audit/i)});
 return {nodes,hasHead,threshold,branches:[{from:'Validate',condition:'Invalid / duplicate',to:'Block submission · log failure',refs:links(/duplicate|mandatory/i)},{from:'Review',condition:'Reject',to:'Unpaid · return to Maker',refs:links(/rejected|rejection/i)},{from:'Review',condition:'Approve',to:hasHead?(threshold!==null?`At or below ${thresholdLabel}: mark Paid · above: Finance Head`:'Finance Head approval · condition needs review'):'Mark Paid',refs:links(/approv|Paid only/i)}],scopeNote:'This workflow uses the sample payment pattern. Requirements outside this pattern remain in the backlog and need a BA-designed workflow.'};
}
export function workflow(w:Workbench) { const base=suggestedWorkflow(w);if(!w.graph)return base;return {...base,nodes:w.graph.nodes,branches:w.graph.edges.filter(e=>e.label).map(e=>({from:w.graph!.nodes.find(n=>n.id===e.from)!.label,condition:e.label,to:w.graph!.nodes.find(n=>n.id===e.to)!.label,refs:[...new Set([...(w.graph!.nodes.find(n=>n.id===e.from)?.refs||[]),...(w.graph!.nodes.find(n=>n.id===e.to)?.refs||[])])]})),scopeNote:'Analyst-designed workflow. Highlighted impacts follow requirement links. Review sequencing, exceptions, and permissions with stakeholders.'};}
export function updateRequirement(w:Workbench,id:string,patch:Partial<Pick<Requirement,'text'|'priority'|'reviewed'>>, evidenceId?:string):Workbench {
 if(!w.requirements.some(r=>r.id===id))throw new Error('Requirement not found.');
 if(patch.text!==undefined && !patch.text.trim())throw new Error('Requirement text cannot be empty.');
 const changedText=patch.text!==undefined && patch.text.trim()!==w.requirements.find(r=>r.id===id)!.text;
 const sourceId=evidenceId || `REF-${String(w.revision+1).padStart(2,'0')}`;
 const reqs=w.requirements.map(r=>r.id===id?{...r,...patch,...(patch.text!==undefined?{text:patch.text.trim(),title:title(patch.text),role:role(patch.text),category:classify(patch.text),reviewed:false,...(changedText?{sourceIds:[...r.sourceIds,sourceId]}:{})}: {})}:r);
 const edits={...w.storyEdits}; if(patch.text!==undefined) { for(const s of stories(w).filter(s=>s.sourceRequirementIds.includes(id))){if(!edits[s.id])continue;const {narrative,criteria,actor,goal,benefit,...details}=edits[s.id];if(Object.keys(details).length)edits[s.id]={...details,needsReview:true};else delete edits[s.id];} }
 return {...w,...(w.relations?.length||Object.keys(w.relationPositions||{}).length?{features:features(w)}:{}),...(w.extraStories?{extraStories:w.extraStories.map(s=>changedText&&(s.requirementId===id||s.sourceRequirementIds?.includes(id))?{...s,needsReview:true}:s)}:{}),graph:w.graph&&changedText?{...w.graph,nodes:w.graph.nodes.map(n=>n.refs.includes(id)?{...n,needsReview:true}:n)}:w.graph,requirements:reqs,storyEdits:edits,sources:changedText?[...w.sources,{id:sourceId,title:evidenceId?`Applied change ${sourceId}`:`BA refinement ${sourceId}`,text:patch.text!.trim()}]:w.sources,revision:w.revision+1};
}
export function impact(w:Workbench,requirementId:string,after:string) {
 const r=w.requirements.find(r=>r.id===requirementId);if(!r)throw new Error('Select a requirement to change.');
 if(!after.trim())throw new Error('Enter the complete replacement requirement.');
 if(after.trim()===r.text)throw new Error('The proposed requirement matches the current requirement.');
 const linkedStories=stories(w).filter(x=>x.sourceRequirementIds.includes(r.id)); const wf=workflow(w).nodes.filter(x=>x.refs.includes(r.id));
 const proposed=updateRequirement(w,r.id,{text:after});
 const wfRows=wf.map(x=>({id:x.id,label:x.label,kind:'Workflow',relation:'Linked step'}));
 if(workflow(proposed).hasHead!==workflow(w).hasHead)wfRows.push({id:'WF-NEW',label:'Finance Head branch changes',kind:'Workflow',relation:'New / removed step'});
 const rows=[{id:r.id,label:r.title,kind:'Requirement',relation:'Direct change'},...linkedStories.map(s=>({id:s.id,label:s.title,kind:'User story',relation:s.id.startsWith('US-C')?'Review story and its ten SRS sections':'Refresh story and review its ten SRS sections'})),...features(w).filter(f=>linkedStories.some(s=>s.featureId===f.id)).map(f=>({id:f.id,label:f.title,kind:f.kind||'Feature',relation:'Review container scope'})),...wfRows,{id:'DOC-01',label:'SRS & traceability matrix',kind:'Documentation',relation:'Refresh linked sections'}];
 const related=relatedNodeIds(w,linkedStories.map(s=>s.id));for(const n of relationNodes(w).filter(n=>related.includes(n.id)&&!rows.some(r=>r.id===n.id)))rows.push({id:n.id,label:n.label,kind:n.kind==='Story'?'User story':n.kind,relation:'Review connected node via explicit project relation'});
 return {requirementId:r.id,before:r.text,after:after.trim(),revision:w.revision,rows,testNotes:['Retest the changed rule and its boundary values.','Retest the Maker, Checker, approval status, and rejection paths.','Review role permissions, audit entries, and existing pending requests.']};
}
export function applyChange(w:Workbench,p:ReturnType<typeof impact>):Workbench {
 if(p.revision!==w.revision || w.requirements.find(r=>r.id===p.requirementId)?.text!==p.before)throw new Error('The baseline changed. Analyze this change again.');
 const id=`CR-${String(w.changes.length+1).padStart(2,'0')}`;const updated=updateRequirement(w,p.requirementId,{text:p.after},id);
 const edits={...updated.storyEdits};for(const row of p.rows.filter(r=>r.relation==='Review connected node via explicit project relation'))if(stories(updated).some(s=>s.id===row.id))edits[row.id]={...edits[row.id],needsReview:true};
 return {...updated,storyEdits:edits,changes:[...w.changes,{id,requirementId:p.requirementId,before:p.before,after:p.after}]};
}
export function answer(query:string,w:Workbench) {if(!query.trim())throw new Error('Enter a question.');const results=retrieve(query,projectEvidence(w));return {results,text:results.length?'The retrieved evidence below is relevant to your question. Confirm how these passages answer it; this sample mode does not infer facts beyond the source text.':'No matching evidence was found in this project. Add the missing requirement or raise it as an open question.'};}
export function analysisAppendix(w:Workbench) {
 const ss=stories(w);const ee=epics(w);const wf=workflow(w);
 return `# ${w.title} — SDLC analysis\n\nRevision ${w.revision} · Draft for BA review\n\n## 1. Purpose and scope\n\nTranslate the supplied business brief into traceable requirements, workflow, epics, user stories, and change impact. Sample retrieval and template generation; all outputs require BA review.\n\n## 2. Business requirements\n\n`+w.requirements.map(r=>`### ${r.id} · ${r.title}\n\n${r.text}\n\nPriority: ${r.priority} · ${r.reviewed?'Reviewed':'Needs review'} · Sources: ${r.sourceIds.join(', ')}`).join('\n\n')+`\n\n## 3. Workflow\n\n`+wf.nodes.map(n=>`- ${n.id}: ${n.role} — ${n.label} [${n.refs.join(', ')}]`).join('\n')+'\n\n'+wf.branches.map(b=>`- ${b.from}: ${b.condition} → ${b.to}`).join('\n')+`\n\n${wf.scopeNote}\n\n## 4. Epics and user stories\n\n`+ee.map(e=>`### ${e.id} · ${e.name}\n\n`+ss.filter(s=>s.epicId===e.id).map(s=>`#### ${s.id} · ${s.title}\n\n${s.narrative}\n\n`+s.criteria.map((c,i)=>`${i+1}. ${c}`).join('\n')).join('\n\n')).join('\n\n')+`\n\n## 5. Traceability\n\n| Source | Requirement | Epic | Story | Workflow |\n| --- | --- | --- | --- | --- |\n`+w.requirements.map(r=>{const linked=ss.filter(x=>x.sourceRequirementIds.includes(r.id));return `| ${r.sourceIds.join(', ')} | ${r.id} | ${[...new Set(linked.map(x=>x.epicId).filter(Boolean))].join(', ')||'Not linked'} | ${linked.map(x=>x.id).join(', ')||'Not linked'} | ${wf.nodes.filter(n=>n.refs.includes(r.id)).map(n=>n.id).join(', ')||'BA design needed'} |`;}).join('\n')+`\n\n## 6. Open questions\n\n`+w.questions.map(q=>'- '+q).join('\n')+`\n\n## 7. Change log\n\n`+(w.changes.length?w.changes.map(c=>`### ${c.id} · ${c.requirementId}\n\nBefore: ${c.before}\n\nAfter: ${c.after}`).join('\n\n'):'No changes applied.')+`\n\n## 8. Source evidence\n\n`+w.sources.map(s=>`### ${s.id} · ${s.title}\n\n${s.text}`).join('\n\n')+`\n\n## 9. Meeting outcomes\n\n`+((w.outcomes||[]).map(o=>`- ${o.id} [${o.kind}] ${o.text} — linked: ${o.requirementIds.join(', ')}`).join('\n')||'No meeting outcomes recorded.')+`\n\n## 10. Workflow connections\n\n`+graphFor(w).edges.map(e=>`- ${e.from} → ${e.to}${e.label?' ['+e.label+']':''}`).join('\n');
}
export function simulate(w:Workbench,scenario:string){
 if(!['happy','high','invalid','duplicate','reject'].includes(scenario))throw new Error('Unknown scenario.');
 const wf=workflow(w);if(!wf.nodes.length)return {title:'No workflow yet',text:'Add a workflow before exploring scenarios.',status:'Not configured',path:[] as string[],tone:'neutral'};const audit=wf.nodes.find(n=>/audit|record.*log/i.test(n.label))?.id||wf.nodes[wf.nodes.length-1].id;
 if(scenario==='invalid')return {title:'Submission blocked',text:'Payment date is missing. The Maker must complete the field before submitting.',status:'Unpaid',path:['WF-01','WF-02'],tone:'warning'};
 if(scenario==='duplicate')return {title:'Duplicate prevented',text:'The bank and transaction ID already exist. No request is submitted; the validation failure is logged.',status:'Unpaid',path:['WF-01','WF-02',audit],tone:'warning'};
 if(scenario==='reject')return {title:'Returned for correction',text:'The Checker rejects with a reason. The Maker corrects the request and resubmits.',status:'Unpaid',path:['WF-01','WF-02','WF-03','WF-04',audit],tone:'warning'};
 if(scenario==='high'&&wf.hasHead&&(wf.threshold===null||50001>wf.threshold))return {title:'Additional approval required',text:wf.threshold===null?'The Finance Head approval condition needs BA review. The outcome cannot be confirmed from the current rule.':'At 50,001 BDT, Checker approval sends the request to Finance Head. The payslip stays Unpaid until that approval.',status:'Pending · Unpaid',path:['WF-01','WF-02','WF-03','WF-04','WF-05'],tone:'blue'};
 if(!['happy','high'].includes(scenario))throw new Error('Unknown scenario.');
 return {title:'Approval completed',text:scenario==='high'?(wf.hasHead?'The amount does not exceed the additional approval threshold. Checker approval completes the request.':'The current baseline has no additional amount-based approver. Checker approval completes the request.'):'All fields pass validation. The Checker approves; the system marks the payslip Paid and records the decision.',status:'Paid',path:wf.nodes.filter(n=>!wf.hasHead||n.role!=='Finance Head').map(n=>n.id),tone:'good'};
}
export function graphFor(w:Workbench):WorkflowGraph {
 if(w.graph)return w.graph;
 const wf=suggestedWorkflow(w);
 const nodes:GraphNode[]=wf.nodes.map((n,i)=>{const row=Math.floor(i/3);const col=row%2===0?i%3:2-i%3;return {...n,x:30+col*330,y:150+row*190,kind:/review|approval/i.test(n.label)?'decision':'step'};});
 const edges:GraphEdge[]=nodes.slice(1).map((n,i)=>({id:`E-${i+1}`,from:nodes[i].id,to:n.id,label:nodes[i].kind==='decision'?'Approve':''}));
 if(w.requirements.some(r=>/payslip|payment/i.test(r.text))){const y=40+Math.ceil(nodes.length/3)*190;nodes.push({id:'WF-REJECT',label:'Return to Maker · remains Unpaid',role:'Finance Maker',refs:w.requirements.filter(r=>/rejected|rejection/i.test(r.text)).map(r=>r.id),x:690,y,kind:'step'},{id:'WF-BLOCK',label:'Block submission · record failure',role:'System',refs:w.requirements.filter(r=>/duplicate|mandatory/i.test(r.text)).map(r=>r.id),x:30,y,kind:'step'});edges.push({id:'E-reject',from:'WF-04',to:'WF-REJECT',label:'Reject'},{id:'E-correct',from:'WF-REJECT',to:'WF-03',label:'Correct & resubmit'},{id:'E-invalid',from:'WF-02',to:'WF-BLOCK',label:'Invalid / duplicate'});}
 if(w.requirements.some(r=>/payslip|payment/i.test(r.text))){const validation=nodes.find(n=>n.id==='WF-02');if(validation){const check:GraphNode={id:'WF-VALID',label:'Validation passed?',role:'System',refs:validation.refs,x:350,y:validation.y+125,kind:'decision'};nodes.push(check);const forward=edges.find(e=>e.from==='WF-02'&&e.to==='WF-03');if(forward){forward.from=check.id;forward.label='Valid';}const failure=edges.find(e=>e.from==='WF-02'&&e.to==='WF-BLOCK');if(failure)failure.from=check.id;edges.push({id:'E-validation',from:'WF-02',to:check.id,label:''});}}
 let g:WorkflowGraph={nodes,edges};if(nodes.length)g=ensureUmlBoundaries(g);return g;
}
export function moveGraphNode(g:WorkflowGraph,id:string,x:number,y:number):WorkflowGraph {if(!Number.isFinite(x)||!Number.isFinite(y)||!g.nodes.some(n=>n.id===id))throw new Error('Invalid node position.');const nextY=Math.max(12,Math.min(6000,y)),lane=g.lanes?.find(l=>nextY+54>=l.y&&nextY+54<l.y+l.height);return {...g,nodes:g.nodes.map(n=>n.id===id?{...n,x:Math.max(g.lanes?135:12,Math.min(800,x)),y:nextY,...(lane?{role:lane.role}:{})}:n)};}
export function connectGraphNodes(g:WorkflowGraph,from:string,to:string,label:string):WorkflowGraph {if(from===to||![from,to].every(id=>g.nodes.some(n=>n.id===id)))throw new Error('Choose two different workflow steps.');if(g.edges.some(e=>e.from===from&&e.to===to))throw new Error('These steps are already connected.');return {...g,edges:[...g.edges,{id:`E-${Date.now()}-${g.edges.length}`,from,to,label:label.trim()}]};}
export function deleteGraphNode(g:WorkflowGraph,id:string):WorkflowGraph {if(!g.nodes.some(n=>n.id===id))throw new Error('Workflow node not found.');return {...g,nodes:g.nodes.filter(n=>n.id!==id),edges:g.edges.filter(e=>e.from!==id&&e.to!==id)};}
export function linkedAreas(w:Workbench,ids:string[]){const valid=ids.filter(id=>w.requirements.some(r=>r.id===id));const s=stories(w).filter(s=>s.sourceRequirementIds.some(id=>valid.includes(id)));return {requirements:valid,stories:s.map(s=>s.id),epics:[...new Set(s.map(s=>s.epicId).filter(Boolean))],features:[...new Set(s.filter(s=>!s.epicId).map(s=>s.featureId))],nodes:graphFor(w).nodes.filter(n=>n.refs.some(id=>valid.includes(id))).map(n=>n.id),documents:valid.length?['DOC-01']:[]};}
export function addMeetingOutcome(w:Workbench,kind:MeetingOutcome['kind'],text:string,requirementIds:string[]):Workbench {if((w.outcomes||[]).length>=200)throw new Error('Use up to 200 meeting outcomes per workspace.');if(!['Decision','Action','Open question'].includes(kind)||!text.trim())throw new Error('Add a meeting outcome.');if(!requirementIds.length||requirementIds.some(id=>!w.requirements.some(r=>r.id===id)))throw new Error('Link at least one valid requirement.');const o={id:`MOM-${String((w.outcomes||[]).length+1).padStart(2,'0')}`,kind,text:text.trim(),requirementIds:[...new Set(requirementIds)]};return {...w,revision:w.revision+1,outcomes:[...(w.outcomes||[]),o],questions:kind==='Open question'?[...w.questions,text.trim()]:w.questions};}
export function extractBaselineText(text:string){
 if(!text.trim())throw new Error('No text was found. For a scanned PDF, paste the text after OCR.');
 const section=text.match(/## Appendix A\. Business requirements\s*\n([\s\S]*?)(?=\n## Appendix B\.|$)/)||text.match(/## 2\. Business requirements\s*\n([\s\S]*?)(?=\n## 3\.|$)/);
 const raw=section?section[1]:text;
 if(!section&&!/\n\s*\n/.test(raw)){if(raw.length>20000)throw new Error('Paste a requirements section below 20,000 characters.');return raw.trim();}
 const blocks=raw.split(/\n\s*\n/).map(b=>b.trim()).filter(b=>b&&!/^#{1,6}\s|^Priority:|^Revision \d|^\|/.test(b));
 const cleaned=blocks.map(b=>b.replace(/\r/g,'').split('\n').filter(l=>!/^#{1,6}\s|^Priority:/.test(l.trim())).join(' ').trim()).filter(Boolean);
 const result=cleaned.join('\n');if(!result)throw new Error('No requirement text was found. Paste the business rules directly.');if(result.length>20000)throw new Error('The extracted document is too long for this prototype. Paste the relevant requirements section (up to 20,000 characters).');return result;
}
export function exportWorkspace(w:Workbench){return JSON.stringify({format:'trace-workspace-v1',workbench:{...w,graph:graphFor(w)}},null,2);}
export function restoreWorkspace(text:string):Workbench {
 const p=JSON.parse(text);if(p?.format!=='trace-workspace-v1')throw new Error('Use a Trace workspace JSON export.');const w=p.workbench as Workbench;
 const str=(x:unknown)=>typeof x==='string'&&x.length<=20000;
 if(w?.autoStories!==undefined&&typeof w.autoStories!=='boolean')throw new Error('Invalid story generation setting.');
 if(!w||!str(w.title)||!w.title.trim()||!Number.isInteger(w.revision)||w.revision<1||!Array.isArray(w.sources)||w.sources.length>200||!w.sources.every(s=>str(s.id)&&str(s.title)&&str(s.text))||!Array.isArray(w.requirements)||w.requirements.length>30||!w.requirements.every(r=>str(r.id)&&str(r.title)&&str(r.text)&&str(r.role)&&categories.includes(r.category)&&['Must','Should','Could'].includes(r.priority)&&typeof r.reviewed==='boolean'&&Array.isArray(r.sourceIds)&&r.sourceIds.length>0&&r.sourceIds.every(id=>w.sources.some(s=>s.id===id)))||!Array.isArray(w.questions)||!w.questions.every(str)||!Array.isArray(w.changes)||!w.changes.every(c=>str(c.id)&&str(c.requirementId)&&str(c.before)&&str(c.after)&&w.requirements.some(r=>r.id===c.requirementId)))throw new Error('The workspace content is invalid.');
 if(w.importedFrom!==undefined&&!str(w.importedFrom))throw new Error('Invalid document name.');
 if(new Set(w.requirements.map(r=>r.id)).size!==w.requirements.length||new Set(w.sources.map(s=>s.id)).size!==w.sources.length)throw new Error('The workspace has duplicate IDs.');
 if(!w.storyEdits||typeof w.storyEdits!=='object'||Array.isArray(w.storyEdits)||!Object.values(w.storyEdits).every(e=>validStoryEdit(e)))throw new Error('Invalid story edits.');
 if(w.graph){const g=w.graph;if(!Array.isArray(g.nodes)||g.nodes.length>60||!g.nodes.every(n=>str(n.id)&&str(n.label)&&str(n.role)&&GRAPH_KINDS.includes(n.kind)&&Number.isFinite(n.x)&&n.x>=0&&n.x<=800&&Number.isFinite(n.y)&&n.y>=0&&n.y<=6000&&Array.isArray(n.refs)&&n.refs.every(id=>w.requirements.some(r=>r.id===id)))||new Set(g.nodes.map(n=>n.id)).size!==g.nodes.length||!Array.isArray(g.edges)||g.edges.length>200||new Set(g.edges.map(e=>e.id)).size!==g.edges.length||!g.edges.every(e=>str(e.id)&&str(e.label)&&e.from!==e.to&&[e.from,e.to].every(id=>g.nodes.some(n=>n.id===id))))throw new Error('Invalid workflow graph.');}
 if(w.graph?.lanes&&(!Array.isArray(w.graph.lanes)||w.graph.lanes.length>12||!w.graph.lanes.every(l=>str(l.role)&&Number.isFinite(l.y)&&Number.isFinite(l.height)&&l.y>=0&&l.height>0&&l.y+l.height<=6500)))throw new Error('Invalid UML swimlanes.');
 if(w.outcomes&&(!Array.isArray(w.outcomes)||w.outcomes.length>200||!w.outcomes.every(o=>str(o.id)&&str(o.text)&&['Decision','Action','Open question'].includes(o.kind)&&Array.isArray(o.requirementIds)&&o.requirementIds.length>0&&o.requirementIds.every(id=>w.requirements.some(r=>r.id===id)))))throw new Error('Invalid meeting outcomes.');
 validateTemplateState(w);validateProjectExtensions(w);
 return w;
}
export function addFeature(w:Workbench,kind:'Feature'|'Epic',titleText:string,jiraId='TBD'):Workbench {
 if(!['Feature','Epic'].includes(kind)||!titleText.trim())throw new Error('Choose Feature or Epic and enter a title.');
 if(titleText.length>160||jiraId.length>100)throw new Error('Keep the title below 160 characters and Jira ID below 100.');
 const ff=features(w);if(ff.length>=24)throw new Error('Use up to 24 features and epics per project.');
 const prefix=kind==='Epic'?'EP-':'F';let number=1;while(ff.some(f=>f.id===prefix+String(number).padStart(2,'0')))number++;
 const f:Feature={id:prefix+String(number).padStart(2,'0'),epicId:'',kind,title:titleText.trim(),jiraId:jiraId.trim()||'TBD'};
 return {...w,revision:w.revision+1,features:[...ff,f]};
}
export function saveFeature(w:Workbench,id:string,titleText:string,jiraId:string,kind?:'Feature'|'Epic'):Workbench {
 if(!titleText.trim()||titleText.length>160||jiraId.length>100)throw new Error('Add a title of up to 160 characters and a Jira ID of up to 100.');
 if(kind!==undefined&&!['Feature','Epic'].includes(kind))throw new Error('Choose Feature or Epic.');
 if(!features(w).some(f=>f.id===id))throw new Error('Feature or epic not found.');
 return {...w,revision:w.revision+1,features:features(w).map(f=>f.id===id?{...f,title:titleText.trim(),jiraId:jiraId.trim()||'TBD',kind:kind||f.kind}:f)};
}
export function addSplitStory(w:Workbench,featureId:string,requirementId:string,titleText:string):Workbench {
 if(stories(w).length>=60||(w.extraStories||[]).length>=60)throw new Error('Use up to 60 user stories per project.');
 if(featureId!==''&&!features(w).some(f=>f.id===featureId)||requirementId&&!w.requirements.some(r=>r.id===requirementId)||!titleText.trim()||titleText.length>160)throw new Error('Choose a feature or epic, a valid optional requirement, and a story title of up to 160 characters.');
 let n=1;while((w.extraStories||[]).some(s=>s.id===`US-C${String(n).padStart(2,'0')}`))n++;const id=`US-C${String(n).padStart(2,'0')}`;
 return {...w,revision:w.revision+1,features:features(w),extraStories:[...(w.extraStories||[]),{id,featureId,requirementId,title:titleText.trim(),goal:'TBD — define one independently testable action',benefit:'TBD — define the user outcome',needsReview:true}]};
}
export function saveStory(w:Workbench,id:string,patch:StoryEdit):Workbench {
 if(!stories(w).some(s=>s.id===id))throw new Error('Story not found.');
 if(!validStoryEdit(patch)||!patch.title?.trim()||!patch.actor?.trim()||!patch.goal?.trim()||!patch.benefit?.trim()||!patch.criteria?.length||patch.criteria.some(c=>!c.trim()))throw new Error('Add the title, actor, action, outcome, and at least one acceptance criterion.');
 if(typeof patch.featureId!=='string'||patch.featureId!==''&&!features(w).some(f=>f.id===patch.featureId))throw new Error('Choose a valid feature or epic.');
 if(patch.requirementId&&!w.requirements.some(r=>r.id===patch.requirementId)||patch.sourceRequirementIds?.some(id=>!w.requirements.some(r=>r.id===id)))throw new Error('Choose valid source requirements.');
 const narrative=`As a ${patch.actor.trim()}, I want to ${patch.goal.trim()}, so I can ${patch.benefit.trim()}.`;const clean=Object.fromEntries(Object.entries(patch).filter(([,value])=>value!==undefined)) as StoryEdit;
 return {...w,revision:w.revision+1,features:features(w),storyEdits:{...w.storyEdits,[id]:{...clean,narrative,...(patch.workflowNodeIds!==undefined?{flowSignature:patch.workflowNodeIds.length?flowSignature(w,patch.workflowNodeIds,[...new Set([...(patch.sourceRequirementIds||[]),...(patch.requirementId?[patch.requirementId]:[])])]):''}:{}),needsReview:false}}};
}
function validStoryEdit(value:unknown):value is StoryEdit {if(!value||typeof value!=='object'||Array.isArray(value))return false;const e=value as Record<string,unknown>;const stringKeys=['title','jiraId','featureId','requirementId','flowSignature','flowSuggestionKey','actor','goal','benefit','narrative','prototypes'];const lists=['sourceRequirementIds','workflowNodeIds','journey','actors','scope','preconditions','impactedAreas','requirements','criteria','exceptions'];return stringKeys.every(k=>e[k]===undefined||typeof e[k]==='string'&&(e[k] as string).length<=20000)&&lists.every(k=>e[k]===undefined||Array.isArray(e[k])&&(e[k] as unknown[]).length<=100&&(e[k] as unknown[]).every(x=>typeof x==='string'&&x.length<=20000))&&(e.needsReview===undefined||typeof e.needsReview==='boolean');}
function validateTemplateState(w:Workbench){
 const str=(x:unknown)=>typeof x==='string'&&x.length<=20000;
 if(w.features&&(!Array.isArray(w.features)||w.features.length>24||!w.features.every(f=>str(f.id)&&!!f.id&&str(f.title)&&str(f.jiraId)&&str(f.epicId)&&(f.kind===undefined||['Feature','Epic'].includes(f.kind)))||new Set(w.features.map(f=>f.id)).size!==w.features.length))throw new Error('Invalid feature hierarchy.');
 const ff=features(w),validReq=(id:unknown)=>id===''||typeof id==='string'&&w.requirements.some(r=>r.id===id);
 if(w.extraStories&&(!Array.isArray(w.extraStories)||w.extraStories.length>60||w.extraStories.length+(w.autoStories===false?0:w.requirements.filter((_,i)=>!w.deletedStoryIds?.includes(`US-${String(i+1).padStart(2,'0')}`)).length)>60||!w.extraStories.every(s=>validStoryEdit(s)&&str(s.id)&&str(s.title)&&validReq(s.requirementId)&&(s.featureId===''||ff.some(f=>f.id===s.featureId)))||new Set(w.extraStories.map(s=>s.id)).size!==w.extraStories.length||w.extraStories.some(s=>w.requirements.some((_,i)=>s.id===`US-${String(i+1).padStart(2,'0')}`))))throw new Error('Invalid split stories.');
 if(w.deletedStoryIds&&(!Array.isArray(w.deletedStoryIds)||new Set(w.deletedStoryIds).size!==w.deletedStoryIds.length||!w.deletedStoryIds.every(id=>typeof id==='string'&&/^US-[0-9]+$/.test(id))))throw new Error('Invalid deleted story IDs.');
 if([...Object.values(w.storyEdits),...(w.extraStories||[])].some(s=>s.sourceRequirementIds?.some(id=>!w.requirements.some(r=>r.id===id))))throw new Error('Invalid story source links.');
 if(Object.values(w.storyEdits).some(s=>s.featureId&&!ff.some(f=>f.id===s.featureId)||s.requirementId!==undefined&&!validReq(s.requirementId)))throw new Error('Invalid story feature or requirement link.');
 if(w.srs&&!validSrs(w.srs))throw new Error('Invalid SRS metadata.');
}
export function getSrs(w:Workbench):SrsMeta {return w.srs||{version:'1.0',revisionDate:'TBD',changeDescription:'Initial analysis draft',affectedSections:'Features and Stories',crId:'TBD',jiraId:'TBD',createdBy:'TBD',creatorTitle:'Business Analyst',reviewedBy:'TBD',reviewerTitle:'BA Lead',approvedBy:'TBD — confirm stakeholders',purpose:`Describe the current implementation and proposed changes for ${w.title}. Confirm the origin of the CR, its objective, and the expected user benefit with stakeholders.`,users:[...new Set(stories(w).map(s=>s.actor))],inScope:features(w).map(f=>f.title),outOfScope:['TBD — agree the excluded functionality.'],risks:[{risk:'Unreviewed or ambiguous business rules',level:'TBD',likelihood:'TBD',mitigation:'Review each rule and its acceptance criteria with the requirement owner.'},{risk:'Missed downstream change impacts',level:'TBD',likelihood:'TBD',mitigation:'Validate requirement, workflow, feature, story, page, and report links.'}],effort:['Project Management','Business Analysis','Development','SQA','Implementation'].map(item=>({item,days:'TBD'})),initiatedBy:'TBD',initiatedOn:'TBD',crType:'TBD',crCategory:'TBD',accumulation:'TBD',note:'Confirm the approved AMC accumulation policy and estimation basis before sign-off.'};}
function validSrs(v:unknown):v is SrsMeta {if(!v||typeof v!=='object')return false;const s=v as SrsMeta;const str=(x:unknown)=>typeof x==='string'&&x.length<=20000;return ['version','revisionDate','changeDescription','affectedSections','crId','jiraId','createdBy','creatorTitle','reviewedBy','reviewerTitle','approvedBy','purpose','initiatedBy','initiatedOn','crType','crCategory','accumulation','note'].every(k=>str(s[k as keyof SrsMeta]))&&['users','inScope','outOfScope'].every(k=>Array.isArray(s[k as 'users'])&&(s[k as 'users']).length<=100&&(s[k as 'users']).every(str))&&Array.isArray(s.risks)&&s.risks.length<=50&&s.risks.every(r=>r&&[r.risk,r.level,r.likelihood,r.mitigation].every(str))&&Array.isArray(s.effort)&&s.effort.length<=30&&s.effort.every(e=>e&&str(e.item)&&str(e.days)&&(e.days==='TBD'||e.days===''||Number.isFinite(Number(e.days))&&Number(e.days)>=0));}
export function saveSrs(w:Workbench,srs:SrsMeta):Workbench {if(!validSrs(srs))throw new Error('Check the SRS fields. Effort must be a non-negative number or TBD.');return {...w,revision:w.revision+1,srs};}
export function effortTotal(s:SrsMeta){return s.effort.every(e=>e.days.trim()!==''&&e.days!=='TBD'&&Number.isFinite(Number(e.days)))?String(s.effort.reduce((n,e)=>n+Number(e.days),0)):'TBD';}
const mdCell=(s:string)=>s.replace(/\|/g,'\\|').replace(/\n/g,'<br>');
const mdList=(xs:string[],numbered=false)=>xs.length?xs.map((x,i)=>/^\s{2,}/.test(x)?'    - '+x.trim():`${numbered?i+1+'.':'-'} ${x}`).join('\n'):'- TBD — complete during requirements review.';
export const STORY_SECTIONS=[{key:'journey',name:'User Journey'},{key:'actors',name:'Actors'},{key:'scope',name:'Scope'},{key:'preconditions',name:'Pre-condition'},{key:'impactedAreas',name:'Impacted Areas'},{key:'prototypes',name:'Mock-up/ Prototypes'},{key:'requirements',name:'Requirements'},{key:'criteria',name:'Acceptance Criteria'},{key:'exceptions',name:'Exceptions'}] as const;
export function storyMarkdown(s:Story){return `#### ${s.number}. ${s.title} | ${s.id} | ${s.jiraId}\n\n**1. User Story:**\n\n${s.narrative}\n\n`+STORY_SECTIONS.map((section,i)=>`**${i+2}. ${section.name}:**\n\n`+(section.key==='prototypes'?s.prototypes:mdList(s[section.key],['journey','requirements','criteria'].includes(section.key)))).join('\n\n')+`\n\nSource requirements: ${s.sourceRequirementIds.join(', ')||'Not linked'} · UML steps: ${s.workflowNodeIds.join(', ')||'Not linked'} · Parent feature / epic: ${s.featureId||'Project'}${s.needsReview?' · Needs review after source change':''}`;}
export function documentMarkdown(w:Workbench){
 const ss=stories(w),ff=features(w),m=getSrs(w),g=graphFor(w);const table=(headers:string[],rows:string[][])=>`| ${headers.join(' | ')} |\n| ${headers.map(()=> '---').join(' | ')} |\n`+rows.map(r=>`| ${r.map(mdCell).join(' | ')} |`).join('\n');
 const ids=new Map(g.nodes.map((n,i)=>[n.id,'n'+i]));const label=(s:string)=>s.replace(/["<>`\n\r]/g,' ').slice(0,140);const diagram=g.nodes.length>0&&g.nodes.length<=20&&g.nodes.every(n=>g.edges.filter(e=>e.from===n.id).length<=5)?'```mermaid\nflowchart TD\n'+g.nodes.map(n=>`  ${ids.get(n.id)}["${label(n.role+': '+n.label)}"]`).join('\n')+'\n'+g.edges.map(e=>`  ${ids.get(e.from)} -->${e.label?'|"'+label(e.label)+'"|':''} ${ids.get(e.to)}`).join('\n')+'\n```':'See the editable workflow canvas; the connections are listed below.';
 return `# ${w.title} — Software Requirements Specification\n\nDraft for review · Based on the supplied SRS Template\n\n`+table(['Field','Value','Title / Role','Signature / Status'],[['Title',w.title,'',''],['CR ID',m.crId,'',''],['JIRA ID',m.jiraId,'',''],['Created by',m.createdBy,m.creatorTitle,'Pending sign-off'],['Reviewed by',m.reviewedBy,m.reviewerTitle,'Pending sign-off'],...m.approvedBy.split('\n').filter(Boolean).map(name=>['Approved by',name,'Client / Stakeholder','Pending sign-off'])])+`\n\n## Revision History\n\n`+table(['Date','Version','Created by','Description of change','Affected Section'],[[m.revisionDate,m.version,m.createdBy,m.changeDescription,m.affectedSections],...w.changes.map(c=>['TBD','TBD',m.createdBy,c.id+': '+c.after,c.requirementId])])+`\n\n## Purpose\n\n${m.purpose}\n\n## Users\n\n`+mdList(m.users)+`\n\n## Scope of this CR\n\n`+table(['Scope Identification','Description'],[['In Scope',m.inScope.join('\n')],['Out of Scope',m.outOfScope.join('\n')]])+`\n\n## Workflow\n\n${diagram}\n\n`+table(['Step ID','UML type','Role','Activity / Decision','Linked Requirements'],g.nodes.map(n=>[n.id,GRAPH_KIND_LABELS[n.kind],n.role,n.label+(n.needsReview?' — NEEDS REVIEW':''),n.refs.join(', ')]))+`\n\n### Workflow connections\n\n`+mdList(g.edges.map(e=>`${e.from} → ${e.to}${e.label?' — '+e.label:''}`))+`\n\n## Table of Contents\n\n`+mdList(['List of Features & Stories','Features',...ff.flatMap((f,i)=>[`${i+1}. ${f.title} | ${f.id} | ${f.jiraId}`,...ss.filter(s=>s.featureId===f.id).map(s=>`${s.number}. ${s.title} | ${s.id} | ${s.jiraId}`)]),'Risk Analysis','Change Effort Estimation','Effort Estimation','CR Accumulation'])+`\n\n## List of Features & Stories\n\n`+table(['Type','Feature / Epic ID','Title','Story ID','JIRA ID','Story Title'],ss.map(s=>[ff.find(f=>f.id===s.featureId)?.kind||'Project',s.featureId,ff.find(f=>f.id===s.featureId)?.title||w.title,s.id,s.jiraId,s.title]))+`\n\n## Features\n\n`+ff.map((f,i)=>`### ${i+1}. ${f.title} | ${f.id} | ${f.jiraId}\n\nType: ${f.kind||'Feature'} · Project: ${w.title}\n\n`+(ss.filter(s=>s.featureId===f.id).map(storyMarkdown).join('\n\n')||'No stories yet — break this feature into independently testable user outcomes.')).join('\n\n')+(ss.some(s=>!s.featureId)?`\n\n### Project stories\n\n`+ss.filter(s=>!s.featureId).map(storyMarkdown).join('\n\n'):'')+`\n\n## Risk Analysis\n\n`+table(['SL','Risk','Level (High/Medium/Low)','Likelihood of Event','Mitigation Plan'],m.risks.map((r,i)=>[String(i+1),r.risk,r.level,r.likelihood,r.mitigation]))+`\n\n## Change Effort Estimation\n\n### 1. Effort Estimation\n\nUnit: Days. Confirm the billing basis before approval.\n\n`+table(['SL','Item','Days'],[...m.effort.map((e,i)=>[String(i+1),e.item,e.days]),['','Total',effortTotal(m)]])+`\n\n### 2. CR Accumulation\n\n`+table(['Field','Value'],[['CR Initiated by',m.initiatedBy],['CR Initiated on',m.initiatedOn],['Type of CR',m.crType],['Category of CR',m.crCategory],['Accumulation (%)',m.accumulation]])+`\n\nNote: ${m.note}\n\n## Appendix A. Business requirements\n\n`+w.requirements.map(r=>`### ${r.id} · ${r.title}\n\n${r.text}\n\nPriority: ${r.priority} · ${r.reviewed?'Reviewed':'Needs review'} · Sources: ${r.sourceIds.join(', ')}`).join('\n\n')+`\n\n## Appendix B. Traceability\n\n`+table(['Source','Requirement','Type','Feature / Epic','Story','Workflow'],ss.map(s=>{const rules=w.requirements.filter(r=>s.sourceRequirementIds.includes(r.id));return [[...new Set(rules.flatMap(r=>r.sourceIds))].join(', ')||'Not linked',rules.map(r=>r.id).join(', ')||'Not linked',ff.find(f=>f.id===s.featureId)?.kind||'Project',s.featureId||'Project',s.id,s.workflowNodeIds.join(', ')||'BA design needed'];}))+`\n\n## Appendix C. Open questions\n\n`+mdList(w.questions)+`\n\n## Appendix D. Meeting outcomes\n\n`+mdList((w.outcomes||[]).map(o=>`${o.id} [${o.kind}] ${o.text} — linked: ${o.requirementIds.join(', ')}`))+`\n\n## Appendix E. Source evidence\n\n`+w.sources.map(s=>`### ${s.id} · ${s.title}\n\n${s.text}`).join('\n\n')+`\n\n## Appendix F. Story relationships\n\n`+mdList((w.relations||[]).map(r=>`${r.from} — ${r.type} → ${r.to}${r.note?' — '+r.note:''}`))+`\n\n## Appendix G. Project knowledge\n\n`+mdList((w.knowledge||[]).map(k=>`${k.name} [${k.id}] — ${k.notes||'No notes'}\n${k.text||'Reference attachment; no searchable text.'}`));
}


export type ProjectRecord={id:string;workbench:Workbench};
export type ProjectCollection={activeId:string;projects:ProjectRecord[];nextProjectNumber?:number;pendingProjectDeletes?:string[]};
export function emptyProject(name:string):Workbench {
 if(!name.trim()||name.length>100)throw new Error('Enter a project name of up to 100 characters.');
 return {title:name.trim(),revision:1,sources:[],requirements:[],features:[],autoStories:false,extraStories:[],storyEdits:{},questions:[],changes:[]};
}
export function sampleProjects():ProjectCollection {return {activeId:'PRJ-001',projects:[{id:'PRJ-001',workbench:sample()}]};}
export function createProject(collection:ProjectCollection,name:string):ProjectCollection {
 if(collection.projects.length>=20)throw new Error('Use up to 20 projects in this prototype.');
 const workbench=emptyProject(name);let n=Math.max(collection.nextProjectNumber||1,...collection.projects.map(p=>Number(p.id.slice(4))+1),...(collection.pendingProjectDeletes||[]).map(id=>Number(id.slice(4))+1));while(collection.projects.some(p=>p.id===`PRJ-${String(n).padStart(3,'0')}`))n++;
 const id=`PRJ-${String(n).padStart(3,'0')}`;return {...collection,activeId:id,nextProjectNumber:n+1,projects:[...collection.projects,{id,workbench}]};
}
export function selectProject(collection:ProjectCollection,id:string):ProjectCollection {if(!collection.projects.some(p=>p.id===id))throw new Error('Project not found.');return {...collection,activeId:id};}
export function updateActiveProject(collection:ProjectCollection,update:Workbench|((w:Workbench)=>Workbench)):ProjectCollection {return {...collection,projects:collection.projects.map(p=>p.id===collection.activeId?{...p,workbench:typeof update==='function'?update(p.workbench):update}:p)};}
export function exportProjects(collection:ProjectCollection){return JSON.stringify({format:'trace-projects-v1',collection},null,2);}
export function restoreProjects(text:string):ProjectCollection {
 const p=JSON.parse(text);if(p?.format==='trace-workspace-v1'){const w=restoreWorkspace(text);return {activeId:'PRJ-001',projects:[{id:'PRJ-001',workbench:w}]};}
 const c=p?.collection as ProjectCollection;
 if(p?.format!=='trace-projects-v1'||!c||!Array.isArray(c.projects)||c.projects.length>20||!c.projects.every(p=>p&&typeof p.id==='string'&&/^PRJ-[0-9]+$/.test(p.id))||new Set(c.projects.map(p=>p.id)).size!==c.projects.length||(c.projects.length?!c.projects.some(p=>p.id===c.activeId):c.activeId!=='')||(c.nextProjectNumber!==undefined&&(!Number.isInteger(c.nextProjectNumber)||c.nextProjectNumber<1)))throw new Error('Use a valid Trace projects JSON export.');
 if(c.pendingProjectDeletes&&(!Array.isArray(c.pendingProjectDeletes)||c.pendingProjectDeletes.length>2000||new Set(c.pendingProjectDeletes).size!==c.pendingProjectDeletes.length||!c.pendingProjectDeletes.every(id=>typeof id==='string'&&/^PRJ-[0-9]+$/.test(id)&&!c.projects.some(p=>p.id===id))))throw new Error('Invalid pending project deletions.');
 return {activeId:c.activeId,...(c.pendingProjectDeletes?{pendingProjectDeletes:c.pendingProjectDeletes}:{}),...(c.nextProjectNumber!==undefined?{nextProjectNumber:c.nextProjectNumber}:{}),projects:c.projects.map(p=>({id:p.id,workbench:restoreWorkspace(JSON.stringify({format:'trace-workspace-v1',workbench:p.workbench}))}))};
}
// Keep manually organized containers and stories when a project gains a brief.
export function analyzeProject(w:Workbench,titleText:string,text:string):Workbench {
 const parsed=analyze(titleText,text),ff=features(w);
 const mapId=(id:string)=>{const prior=w.requirements.find(r=>r.id===id);return prior?parsed.requirements.find(r=>r.text===prior.text)?.id||'':'';};
 const extras=(w.extraStories||[]).map(s=>({...s,requirementId:mapId(s.requirementId),...(s.sourceRequirementIds?{sourceRequirementIds:s.sourceRequirementIds.map(mapId).filter(Boolean)}:{}),needsReview:true}));
 const edits:Record<string,StoryEdit>={};for(const s of extras){const edit=w.storyEdits[s.id];if(edit)edits[s.id]={...edit,requirementId:mapId(edit.requirementId===undefined?w.extraStories!.find(x=>x.id===s.id)!.requirementId:edit.requirementId),needsReview:true,sourceRequirementIds:(edit.sourceRequirementIds||[]).map(mapId).filter(Boolean)};}
 const graph=w.graph?{...w.graph,nodes:w.graph.nodes.map(n=>({...n,refs:n.refs.map(mapId).filter(Boolean),needsReview:n.needsReview||n.refs.some(id=>!mapId(id))}))}:undefined;
 const next:Workbench={...parsed,...(ff.length?{features:ff}:{}),autoStories:w.autoStories,extraStories:extras,storyEdits:edits,srs:w.srs,knowledge:w.knowledge,...(graph?{graph}:{}),outcomes:w.outcomes?.map(o=>({...o,requirementIds:o.requirementIds.map(mapId).filter(Boolean)}))};
 const ids=relationNodes(next).map(n=>n.id);next.relations=(w.relations||[]).filter(r=>ids.includes(r.from)&&ids.includes(r.to)&&!/^US-[0-9]+$/.test(r.from)&&!/^US-[0-9]+$/.test(r.to));next.relationPositions=Object.fromEntries(Object.entries(w.relationPositions||{}).filter(([id])=>ids.includes(id)));return next;
}

export function projectEvidence(w:Workbench):Source[]{
 const active=new Set(w.requirements.map(r=>r.sourceIds[r.sourceIds.length-1]));
 return [...w.sources.filter(s=>active.has(s.id)),...(w.knowledge||[]).flatMap(k=>{const text=[k.notes,k.text].filter(Boolean).join('\n');const chunks=text.match(/[\s\S]{1,2000}/g)||[];return chunks.map((text,i)=>({id:`MEM-${k.id}-${i+1}`,title:`${k.name} · knowledge ${i+1}`,text}));})];
}
export function addKnowledge(w:Workbench,item:KnowledgeItem):Workbench {
 if((w.knowledge||[]).length>=20)throw new Error('Use up to 20 knowledge items per project.');
 if(!validKnowledge(item)||(w.knowledge||[]).some(k=>k.id===item.id))throw new Error('Invalid or duplicate knowledge file.');
 return {...w,revision:w.revision+1,knowledge:[...(w.knowledge||[]),item]};
}
export function saveKnowledge(w:Workbench,id:string,text:string,notes:string):Workbench {
 if(text.length>20000||notes.length>5000)throw new Error('Use up to 20,000 indexed characters and 5,000 note characters.');
 if(!w.knowledge?.some(k=>k.id===id))throw new Error('Knowledge item not found.');
 return {...w,revision:w.revision+1,knowledge:w.knowledge.map(k=>k.id===id?{...k,text,notes}:k)};
}
export function removeKnowledge(w:Workbench,id:string):Workbench {return {...w,revision:w.revision+1,knowledge:(w.knowledge||[]).filter(k=>k.id!==id)};}
function validKnowledge(k:KnowledgeItem){return k&&typeof k.id==='string'&&k.id.length>0&&k.id.length<=100&&(k.fileId===undefined||typeof k.fileId==='string'&&k.fileId.length<=100)&&typeof k.name==='string'&&k.name.length<=200&&typeof k.mime==='string'&&k.mime.length<=150&&Number.isInteger(k.size)&&k.size>=0&&k.size<=5*1024*1024&&typeof k.text==='string'&&k.text.length<=20000&&typeof k.notes==='string'&&k.notes.length<=5000&&typeof k.addedAt==='string'&&k.addedAt.length<=100;}
export const RELATION_TYPES=['relates to','depends on','blocks','supports'] as const;
export function relationNodes(w:Workbench){return [{id:'PROJECT',label:w.title,kind:'Project'},...features(w).map(f=>({id:f.id,label:f.title,kind:f.kind||'Feature'})),...stories(w).map(s=>({id:s.id,label:s.title,kind:'Story'})),...graphFor(w).nodes.map(n=>({id:'FLOW:'+n.id,label:n.label,kind:'Workflow'}))];}
export function membershipEdges(w:Workbench){const g=graphFor(w),ss=stories(w);return [...features(w).map(f=>({id:`member-${f.id}`,from:'PROJECT',to:f.id,type:'contains',note:''})),...ss.map(s=>({id:`member-${s.id}`,from:s.featureId||'PROJECT',to:s.id,type:'contains',note:''})),...g.nodes.filter(n=>n.kind==='initial'||!g.edges.some(e=>e.to===n.id)).map(n=>({id:`member-flow-${n.id}`,from:'PROJECT',to:'FLOW:'+n.id,type:'contains',note:''})),...g.edges.map(e=>({id:'control-'+e.id,from:'FLOW:'+e.from,to:'FLOW:'+e.to,type:'control flow',note:e.label})),...ss.flatMap(s=>s.workflowNodeIds.filter(id=>g.nodes.some(n=>n.id===id)).map(id=>({id:`trace-${id}-${s.id}`,from:'FLOW:'+id,to:s.id,type:'described by',note:''})))];}

export function addRelation(w:Workbench,from:string,to:string,type:Relation['type'],note=''):Workbench {
 const nn=relationNodes(w);if(from===to||![from,to].every(id=>nn.some(n=>n.id===id)))throw new Error('Choose two different project nodes.');
 if(!RELATION_TYPES.includes(type)||note.length>1000)throw new Error('Choose a relation type and keep the note below 1,000 characters.');
 if((w.relations||[]).length>=200)throw new Error('Use up to 200 relations per project.');
 if((w.relations||[]).some(r=>r.from===from&&r.to===to&&r.type===type))throw new Error('This relation already exists.');
 let n=1;while(w.relations?.some(r=>r.id===`REL-${n}`))n++;
 return {...w,revision:w.revision+1,relations:[...(w.relations||[]),{id:`REL-${n}`,from,to,type,note:note.trim()}]};
}
export function deleteRelation(w:Workbench,id:string):Workbench {return {...w,revision:w.revision+1,relations:(w.relations||[]).filter(r=>r.id!==id)};}
export function positionRelationNode(w:Workbench,id:string,x:number,y:number):Workbench {if(!relationNodes(w).some(n=>n.id===id)||!Number.isFinite(x)||!Number.isFinite(y))throw new Error('Invalid node position.');return {...w,relationPositions:{...w.relationPositions,[id]:{x:Math.max(20,Math.min(780,x)),y:Math.max(20,Math.min(6000,y))}}};}
function validateProjectExtensions(w:Workbench){
 if(w.knowledge&&(!Array.isArray(w.knowledge)||w.knowledge.length>20||!w.knowledge.every(validKnowledge)||new Set(w.knowledge.map(k=>k.id)).size!==w.knowledge.length))throw new Error('Invalid project knowledge.');
 const ids=relationNodes(w).map(n=>n.id);if(new Set(ids).size!==ids.length)throw new Error('Duplicate project node IDs.');
 if(w.relations&&(!Array.isArray(w.relations)||w.relations.length>200||new Set(w.relations.map(r=>r.id)).size!==w.relations.length||!w.relations.every(r=>r&&typeof r.id==='string'&&r.id.length<=100&&ids.includes(r.from)&&ids.includes(r.to)&&r.from!==r.to&&RELATION_TYPES.includes(r.type)&&typeof r.note==='string'&&r.note.length<=1000)))throw new Error('Invalid project relations.');
 if(w.relationPositions&&(typeof w.relationPositions!=='object'||Array.isArray(w.relationPositions)||Object.entries(w.relationPositions).some(([id,p])=>!ids.includes(id)||!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<20||p.x>780||p.y<20||p.y>6000)))throw new Error('Invalid relation layout.');
}

// Connections mark review candidates; they do not assert a business rule changed.
export function relatedNodeIds(w:Workbench,start:string[]){const found=new Set(start),queue=[...start];while(queue.length){const id=queue.shift()!;for(const r of w.relations||[]){const other=r.from===id?r.to:r.to===id?r.from:null;if(other&&!found.has(other)){found.add(other);queue.push(other);}}}return [...found];}


export function deleteProjectFromCollection(collection:ProjectCollection,id:string):ProjectCollection {
 if(!collection.projects.some(p=>p.id===id))throw new Error('Project not found.');
 const projects=collection.projects.filter(p=>p.id!==id);
 const nextProjectNumber=Math.max(collection.nextProjectNumber||1,...collection.projects.map(p=>Number(p.id.slice(4))+1));
 return {...collection,projects,nextProjectNumber,pendingProjectDeletes:[...new Set([...(collection.pendingProjectDeletes||[]),id])],activeId:collection.activeId===id?projects[0]?.id||'':collection.activeId};
}
export function deleteStory(w:Workbench,id:string):Workbench {
 if(!stories(w).some(s=>s.id===id))throw new Error('Story not found.');
 const edits={...w.storyEdits};delete edits[id];
 const positions={...w.relationPositions};delete positions[id];
 return {...w,revision:w.revision+1,features:features(w),extraStories:(w.extraStories||[]).filter(s=>s.id!==id),storyEdits:edits,...(/^US-[0-9]+$/.test(id)?{deletedStoryIds:[...new Set([...(w.deletedStoryIds||[]),id])]}:{}),relations:(w.relations||[]).filter(r=>r.from!==id&&r.to!==id),relationPositions:positions};
}
export function deleteFeature(w:Workbench,id:string,cascade=false):Workbench {
 if(!features(w).some(f=>f.id===id))throw new Error('Feature or epic not found.');
 let next:Workbench={...w,features:features(w)};const children=stories(w).filter(s=>s.featureId===id);
 if(cascade){for(const s of children)next=deleteStory(next,s.id);}else{const edits={...next.storyEdits};for(const s of children)edits[s.id]={...edits[s.id],featureId:''};next={...next,storyEdits:edits,extraStories:(next.extraStories||[]).map(s=>s.featureId===id?{...s,featureId:''}:s)};}
 const positions={...next.relationPositions};delete positions[id];
 return {...next,revision:w.revision+1,features:features(next).filter(f=>f.id!==id),relations:(next.relations||[]).filter(r=>r.from!==id&&r.to!==id),relationPositions:positions};
}
export const GRAPH_KINDS:GraphKind[]=['step','decision','initial','final','fork','join','merge'];
export const GRAPH_KIND_LABELS:Record<GraphKind,string>={step:'Activity',decision:'Decision',initial:'Start',final:'Activity final',fork:'Fork',join:'Join',merge:'Merge'};
export function ensureUmlBoundaries(graph:WorkflowGraph):WorkflowGraph {
 if(!graph.nodes.length)return graph;
 const needed=Number(!graph.nodes.some(n=>n.kind==='initial'))+Number(!graph.nodes.some(n=>n.kind==='final'));if(graph.nodes.length+needed>60)throw new Error('Leave space for start and end nodes within the 60-node limit.');
 const nodes=[...graph.nodes],edges=[...graph.edges],fresh=(prefix:string)=>{let id=prefix,n=1;while(nodes.some(x=>x.id===id))id=prefix+'-'+n++;return id;};
 if(!nodes.some(n=>n.kind==='initial')){const id=fresh('UML-START');const roots=nodes.filter(n=>!edges.some(e=>e.to===n.id));nodes.push({id,label:'Start process',role:'Process',refs:[],x:350,y:12,kind:'initial'});for(const n of roots.slice(0,1))edges.push({id:`${id}-edge`,from:id,to:n.id,label:''});}
 if(!nodes.some(n=>n.kind==='final')){const id=fresh('UML-END');const ends=nodes.filter(n=>n.kind!=='initial'&&!edges.some(e=>e.from===n.id));nodes.push({id,label:'End process',role:'Process',refs:[],x:350,y:Math.min(6000,Math.max(...nodes.map(n=>n.y))+170),kind:'final'});for(const [i,n] of ends.entries())edges.push({id:`${id}-edge-${i}`,from:n.id,to:id,label:''});}
 return {...graph,nodes,edges};
}
export function arrangeUmlGraph(graph:WorkflowGraph):WorkflowGraph {
 const g=ensureUmlBoundaries(graph),inside=g.nodes.filter(n=>n.kind!=='initial'&&n.kind!=='final'),roles=[...new Set(inside.map(n=>n.role))];if(roles.length>12)throw new Error('Use up to 12 responsible roles for swimlane layout.');
 const initials=g.nodes.filter(n=>n.kind==='initial'),finals=g.nodes.filter(n=>n.kind==='final');let y=Math.max(170,Math.ceil(initials.length/3)*140+30);
 const lanes=roles.map(role=>{const count=inside.filter(n=>n.role===role).length;const lane={role,y,height:Math.max(220,Math.ceil(count/3)*180+75)};y+=lane.height;return lane;});
 return {...g,lanes,nodes:g.nodes.map(n=>{if(n.kind==='initial'){const i=initials.findIndex(x=>x.id===n.id);return {...n,x:145+(i%3)*290,y:25+Math.floor(i/3)*140};}if(n.kind==='final'){const i=finals.findIndex(x=>x.id===n.id);return {...n,x:145+(i%3)*290,y:y+35+Math.floor(i/3)*140};}const lane=lanes.find(l=>l.role===n.role)!;const i=inside.filter(x=>x.role===n.role).findIndex(x=>x.id===n.id);return {...n,x:145+(i%3)*290,y:lane.y+55+Math.floor(i/3)*180};})};
}

export function umlWarnings(g:WorkflowGraph){
 const issues:string[]=[];if(!g.nodes.length)return ['Add activities before suggesting stories.'];if(!g.nodes.some(n=>n.kind==='initial'))issues.push('Add a start node.');if(!g.nodes.some(n=>n.kind==='final'))issues.push('Add an activity final node.');
 for(const n of g.nodes){const incoming=g.edges.filter(e=>e.to===n.id),outgoing=g.edges.filter(e=>e.from===n.id);if(n.kind==='initial'&&incoming.length)issues.push(`${n.id}: a start node should have no incoming flow.`);if(n.kind==='final'&&outgoing.length)issues.push(`${n.id}: an activity final should have no outgoing flow.`);if(n.kind==='decision'&&(outgoing.length<2||outgoing.some(e=>!e.label.trim())))issues.push(`${n.id}: name at least two decision guards.`);if(n.kind==='fork'&&(incoming.length!==1||outgoing.length<2))issues.push(`${n.id}: a fork needs one incoming and multiple outgoing flows.`);if((n.kind==='join'||n.kind==='merge')&&(incoming.length<2||outgoing.length!==1))issues.push(`${n.id}: a join/merge needs multiple incoming and one outgoing flow.`);if(!incoming.length&&!outgoing.length)issues.push(`${n.id}: this node is disconnected.`);}
 return issues;
}
export function flowSignature(w:Workbench,ids:string[],ruleIds:string[]){const g=graphFor(w);const text=JSON.stringify({nodes:ids.map(id=>{const n=g.nodes.find(n=>n.id===id);return n?{id:n.id,label:n.label,role:n.role,kind:n.kind,refs:n.refs}:{id,missing:true};}),edges:g.edges.filter(e=>ids.includes(e.from)||ids.includes(e.to)).map(e=>({from:e.from,to:e.to,label:e.label})),rules:ruleIds.map(id=>({id,text:w.requirements.find(r=>r.id===id)?.text||'Missing'}))});let hash=2166136261;for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}return (hash>>>0).toString(16);}
export function applyWorkflowGraph(w:Workbench,g:WorkflowGraph,bump=true):Workbench {
 const previous=graphFor(w),changed=new Set<string>();for(const n of previous.nodes){const now=g.nodes.find(x=>x.id===n.id);if(!now||JSON.stringify([n.label,n.role,n.kind,n.refs])!==JSON.stringify([now.label,now.role,now.kind,now.refs]))changed.add(n.id);}for(const edge of previous.edges){const now=g.edges.find(e=>e.id===edge.id);if(!now||edge.from!==now.from||edge.to!==now.to||edge.label!==now.label){changed.add(edge.from);changed.add(edge.to);}}for(const e of g.edges)if(!previous.edges.some(p=>p.id===e.id)){changed.add(e.from);changed.add(e.to);}
 const edits={...w.storyEdits};for(const s of stories(w))if(s.workflowNodeIds.some(id=>changed.has(id)))edits[s.id]={...edits[s.id],needsReview:true};
 return {...w,graph:g,storyEdits:edits,revision:w.revision+(bump?1:0)};
}
export function deleteWorkflowStep(w:Workbench,id:string):Workbench {
 const old=stories(w),next=applyWorkflowGraph(w,deleteGraphNode(graphFor(w),id));const edits={...next.storyEdits};for(const s of old.filter(s=>s.workflowNodeIds.includes(id)))edits[s.id]={...edits[s.id],workflowNodeIds:s.workflowNodeIds.filter(x=>x!==id),needsReview:true};const key='FLOW:'+id,positions={...next.relationPositions};delete positions[key];return {...next,storyEdits:edits,relations:(next.relations||[]).filter(r=>r.from!==key&&r.to!==key),relationPositions:positions};
}
export function deleteRelationNode(w:Workbench,id:string,cascade=false):Workbench {if(id==='PROJECT')throw new Error('Delete the project from Projects.');if(id.startsWith('FLOW:'))return deleteWorkflowStep(w,id.slice(5));if(features(w).some(f=>f.id===id))return deleteFeature(w,id,cascade);return deleteStory(w,id);}
export function relationNeighborhood(w:Workbench,id:string){return [...new Set([id,...[...membershipEdges(w),...(w.relations||[])].filter(e=>e.from===id||e.to===id).flatMap(e=>[e.from,e.to])])];}

export type FlowSuggestion={key:string;anchorId:string;workflowNodeIds:string[];requirementIds:string[];content:StoryContent;signature:string;warnings:string[];existingStoryId?:string};
function pathToNode(g:WorkflowGraph,target:string){const roots=g.nodes.filter(n=>n.kind==='initial');const start=roots.length?roots:g.nodes.filter(n=>!g.edges.some(e=>e.to===n.id));const queue=start.map(n=>[n.id]),seen=new Set<string>();while(queue.length){const path=queue.shift()!,id=path[path.length-1];if(id===target)return path;if(seen.has(id))continue;seen.add(id);for(const e of g.edges.filter(e=>e.from===id))queue.push([...path,e.to]);}return [target];}
export function suggestFlowStories(w:Workbench):{revision:number;suggestions:FlowSuggestion[];warnings:string[]} {
 const g=graphFor(w),existing=stories(w),suggestions:FlowSuggestion[]=[];
 for(const anchor of g.nodes.filter(n=>n.kind==='step'||n.kind==='decision')){
  const outgoing=g.edges.filter(e=>e.from===anchor.id);const choices=anchor.kind==='decision'?outgoing:[undefined];
  for(const choice of choices){const key=`${anchor.id}|${choice?.id||'activity'}`;
   const incoming=g.edges.filter(e=>e.to===anchor.id),target=choice?g.nodes.find(n=>n.id===choice.to):outgoing.length===1?g.nodes.find(n=>n.id===outgoing[0].to):undefined;
   const path=pathToNode(g,anchor.id),ids=[...new Set([...path,...(target?[target.id]:[])])];
   let ruleIds=[...new Set([...anchor.refs,...(target?.refs||[])])].filter(id=>w.requirements.some(r=>r.id===id));const warnings:string[]=[];
   if(!ruleIds.length){const matches=retrieve(anchor.label+' '+(choice?.label||''),w.requirements.map(r=>({id:r.id,title:r.title,text:r.text})),2);ruleIds=matches.map(r=>r.id);if(ruleIds.length)warnings.push('Requirement links are suggested by text similarity. Confirm them before creating the story.');else warnings.push('No supporting requirement is linked. Confirm the business rules.');}
   const rules=w.requirements.filter(r=>ruleIds.includes(r.id)),guard=choice?.label.replace(/^\[|\]$/g,'').trim();if(choice&&!guard)warnings.push('The branch guard is unnamed. Define its condition.');
   const actor=/^system$|^process$/i.test(anchor.role)?rules.find(r=>!/^system$|^process$/i.test(r.role))?.role||'Business user':anchor.role;
   const titleText=(choice?`${guard||'Unnamed'} path · ${anchor.label}`:anchor.label).slice(0,160);
   const goal=choice?(/^approve$/i.test(guard||'')&&/request/i.test(anchor.label)?'approve a submitted request':/^reject$/i.test(guard||'')&&/request/i.test(anchor.label)?'reject a submitted request'+(rules.some(r=>/rejection reason/i.test(r.text))?' with a reason':''):`choose the ${guard||'TBD'} path in ${anchor.label.replace(/\?$/,'')}`):/^system$/i.test(anchor.role)?`have ${anchor.label.charAt(0).toLowerCase()+anchor.label.slice(1)}`:anchor.label.charAt(0).toLowerCase()+anchor.label.slice(1);
   const benefit=target?`continue to ${target.label.charAt(0).toLowerCase()+target.label.slice(1)}`:'TBD — confirm the user benefit and completion outcome';
   const journey=ids.map(id=>g.nodes.find(n=>n.id===id)!).filter(Boolean).map(n=>`${n.role}: ${n.label}`);
   if(choice)journey.push(`Branch [${guard||'TBD'}]: ${anchor.label} → ${target?.label||choice.to}`);
   const preconditions=[...incoming.map(e=>`The flow reaches ${anchor.label} from ${g.nodes.find(n=>n.id===e.from)?.label||e.from}${e.label?' with guard ['+e.label+']':''}.`),'TBD — confirm access permissions and starting data.'];
   const criteria=[`Given the flow reaches ${anchor.label}, when ${choice?'the ['+(guard||'TBD')+'] condition is satisfied':actor+' completes this activity'}, then ${target?'the flow proceeds to '+target.label:'the defined outgoing control flow is followed; confirm the final outcome'}.`,...rules.flatMap(acceptance)];
   const otherBranches=anchor.kind==='decision'?outgoing.filter(e=>e.id!==choice?.id).map(e=>`Alternative [${e.label||'TBD'}] path leads to ${g.nodes.find(n=>n.id===e.to)?.label||e.to}.`):[];
   const content:StoryContent={title:titleText,jiraId:'TBD',featureId:'',actor,goal,benefit,narrative:`As a ${actor}, I want to ${goal}, so I can ${benefit}.`,journey,actors:[...new Set([actor,...ids.map(id=>g.nodes.find(n=>n.id===id)?.role||'').filter(r=>r&&r!=='Process')])],scope:[`Activity/decision: ${anchor.id} — ${anchor.label}`,...(choice?[`Branch guard: ${guard||'TBD'}`]:[]),...rules.map(r=>`Rule ${r.id}: ${r.title}`)],preconditions,impactedAreas:['Pages: TBD — confirm impacted screens.','Reports: TBD — confirm impacted reports.',...ids.map(id=>`UML step: ${id} — ${g.nodes.find(n=>n.id===id)?.label}`)],prototypes:'TBD — link a mock-up; the UML diagram is the process reference.',requirements:rules.map(r=>`${r.id}: ${r.text}`),criteria:[...new Set(criteria)].slice(0,100),exceptions:[...otherBranches,...rules.flatMap(r=>r.text.split(/(?<=[.!?])\s+/).filter(t=>/cannot|blocked|rejected|rejection|duplicate/i.test(t)))]};
   suggestions.push({key,anchorId:anchor.id,workflowNodeIds:ids,requirementIds:ruleIds,content,signature:flowSignature(w,ids,ruleIds),warnings,existingStoryId:existing.find(s=>s.flowSuggestionKey===key)?.id});
  }
 }
 return {revision:w.revision,suggestions,warnings:umlWarnings(g)};
}
export function acceptFlowSuggestions(w:Workbench,keys:string[],featureId:string,previewRevision:number):Workbench {
 if(w.revision!==previewRevision)throw new Error('The project changed. Refresh story suggestions before creating drafts.');
 if(!keys.length)throw new Error('Select at least one suggested story.');if(new Set(keys).size!==keys.length)throw new Error('Select each suggested story once.');
 const preview=suggestFlowStories(w);const selected=keys.map(key=>preview.suggestions.find(s=>s.key===key));if(selected.some(s=>!s||s.existingStoryId))throw new Error('A selected suggestion is missing or already has a story.');
 if(stories(w).length+selected.length>60)throw new Error('Use up to 60 stories per project.');let next=w;
 for(const s of selected as FlowSuggestion[]){next=addSplitStory(next,featureId,s.requirementIds[0]||'',s.content.title);const id=next.extraStories![next.extraStories!.length-1].id;next={...next,extraStories:next.extraStories!.map(x=>x.id===id?{...x,...s.content,featureId,sourceRequirementIds:s.requirementIds,workflowNodeIds:s.workflowNodeIds,flowSignature:s.signature,flowSuggestionKey:s.key,needsReview:true}:x)};}
 return {...next,revision:w.revision+1};
}
