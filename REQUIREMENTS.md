# Trace · SDLC Workbench — Product Requirements

| Field | Value |
| --- | --- |
| Owner | Amit Paul, Business Analyst |
| Version | 0.1 — public browser prototype |
| Baseline date | 2026-10-15 |
| Repository | https://github.com/amitpoa/sdlc-workbench |
| Status | Prototype baseline; stakeholder approval and production readiness are not implied |

## 1. Purpose and users

Help Business Analysts understand an existing process, propose a change, model its workflow, break delivery into stories and trace effects on requirements and documentation within one project.

The public version showcases BA activities and lets visitors test sample data or run their own copy without an account, paid service or external dataset.

| User | Need | Observable outcome |
| --- | --- | --- |
| Business Analyst | Capture evidence and stakeholder decisions | Rules, source references, open questions and meeting outcomes in a project |
| Product owner/reviewer | Understand scope and dependencies | Focused stories under features/epics and visible relationships |
| Developer/QA reviewer | Understand behavior and exceptions | Testable criteria, rules, flow references and exceptions |
| Portfolio visitor | Explore and reuse the workbench | A working sample, understandable output and local setup instructions |

These are usage roles. The public prototype has no account roles or access permissions.

## 2. Scope

**Included:** project lifecycle; requirements; project knowledge; keyword retrieval; features/epics and stories; interactive UML activity workflows; meeting outcomes; relationships; source-aware draft suggestions; SRS exports; change impact; browser persistence; a showcase, samples and static-hosting workflow.

**Current boundaries:**

- Drafting uses deterministic templates. Connected LLMs, embeddings, model training and OCR are not implemented.
- Visitors have independent browser workspaces. Accounts, shared editing, cloud synchronization and server backups are not implemented.
- UML is an activity-diagram subset, not a complete UML modeling or executable BPMN product.
- The payment simulator covers sample scenarios, not arbitrary business-process execution.
- Jira IDs and prototype links are references; Jira/Figma integrations are not connected.
- The separately hosted private workbench remains separate. Public publication must not expose its credentials, original uploads or project data, or change its access settings.

## 3. Data and hierarchy

| Entity | Required behavior |
| --- | --- |
| Project | Owns requirements, sources, knowledge, containers, stories, workflow, relationships, meeting outcomes and SRS metadata |
| Feature / Epic | Alternative story containers directly under a project; an epic does not require a feature underneath it |
| Story | Belongs to one feature, one epic or the project; may reference multiple requirements and UML nodes |
| Knowledge item | Project-owned metadata, notes, indexed text and optional original-file reference |
| Workflow node / connector | Process/control-flow element with a role, rule links and guarded paths |
| Relationship | Connects supported nodes within a project without changing their parent |
| Change proposal | Replacement rule and affected artifacts tied to a baseline revision |

Cross-project relationships are outside scope. A workflow node in Relations refers to the same workflow record, so deletion in either view has the same effect.

## 4. Functional requirements

This section defines the implemented prototype's intended behavior. Acceptance criteria are a validation contract, not a claim that every criterion has passed in a real browser.

### FR-01 — Project lifecycle

The analyst shall create, select and delete independent workbenches, including empty projects.

- **AC-01.1:** A valid project title creates a usable empty workspace without requiring rules or a workflow first.
- **AC-01.2:** Features, epics and project-level stories can be created in that workspace.
- **AC-01.3:** Confirmed deletion removes the selected project's analysis and local originals.
- **AC-01.4:** Interrupted original-file cleanup is recorded and retryable without deleting another project's files.
- **AC-01.5:** Deleting the last project leaves a usable empty list; a new project gets a fresh identifier.

### FR-02 — Existing business requirements (H1)

The analyst shall import a brief, inspect evidence, establish a rule baseline and refine it before a change.

- **AC-02.1:** The sample brief produces requirements with inspectable source references.
- **AC-02.2:** Rule text and review status can be refined; changes identify affected content for review.
- **AC-02.3:** A Knowledge attachment does not silently become an approved requirement.
- **AC-02.4:** Ambiguous input requires analyst interpretation; drafts are not represented as approved rules.

### FR-03 — Project knowledge and retrieval (H4)

The analyst shall keep documents, images, XML/XAML, Markdown and notes in project context.

- **AC-03.1:** Supported originals can be attached, listed, downloaded and removed within their owning project.
- **AC-03.2:** Text-based PDF, DOCX and supported text formats provide indexed text; notes supplement references.
- **AC-03.3:** Images/scans need notes or transcription; no OCR extraction is claimed.
- **AC-03.4:** Retrieval exposes matching passages and does not invent an answer when evidence does not match.
- **AC-03.5:** XML/XAML and diagram sources are read as data/text, not executed.

### FR-04 — Interactive UML and meeting outcomes (H2, H6)

The analyst shall design a workflow and connect meeting decisions to requirements and process context.

- **AC-04.1:** Support activity, decision, start, final, fork, join and merge nodes with connectors.
- **AC-04.2:** Move nodes and arrange role/swimlane layouts; edit labels, roles and linked requirements.
- **AC-04.3:** Edit branch guards and add/remove connectors or nodes.
- **AC-04.4:** Capture meeting outcomes linked to requirements for review and documentation.
- **AC-04.5:** Export the workflow as SVG and include its representation in the SRS.

### FR-05 — Feature/epic and story breakdown (H3)

The analyst shall start from either a feature or an epic, or write stories directly under the project.

- **AC-05.1:** A container is optional for project-level stories.
- **AC-05.2:** Containers and stories have stable identifiers and optional Jira references; stories can be reassigned in the editor.
- **AC-05.3:** Stories can be written before evidence is available, with missing links visible.
- **AC-05.4:** Deleting a container moves its stories to the project by default; deleting those stories requires explicit cascade selection.

### FR-06 — Structured story writing (H3)

Every story shall use the agreed ten-section SRS format.

| Section | Required content |
| --- | --- |
| 1. User Story | Actor, action and benefit: “As a …, I want to …, so I can …” |
| 2. User Journey | Ordered steps through the process |
| 3. Actors | People or system roles involved |
| 4. Scope | Behavior included in this story |
| 5. Pre-condition | Conditions required before the action |
| 6. Impacted Areas | Pages, reports, workflow steps or integrations; unconfirmed details stay TBD |
| 7. Mock-up/ Prototypes | Supplied reference or TBD |
| 8. Requirements | Rules, validation and dependencies |
| 9. Acceptance Criteria | Observable success, boundary and failure conditions; Given/When/Then where appropriate |
| 10. Exceptions | Alternative paths and exceptional behavior |

- **AC-06.1:** All sections can be edited and appear in the exported story/SRS.
- **AC-06.2:** Preserve parent, requirement and UML references with the story.
- **AC-06.3:** Unprovided facts, screens or mock-ups remain explicit placeholders.

### FR-07 — Flow-aware story suggestions (H6)

The system shall suggest drafts from current UML flow and linked requirements.

- **AC-07.1:** Include roles, steps, guards, supporting requirements and all ten story sections.
- **AC-07.2:** Let the analyst preview, select candidates and choose a project/feature/epic parent.
- **AC-07.3:** Reject a stale preview and prevent creating the same candidate twice from that preview.
- **AC-07.4:** Semantic changes to linked steps, roles, guards or rules mark affected flow-derived stories for review. Position changes alone do not change business meaning.
- **AC-07.5:** Describe the behavior as source-aware drafting, not model learning or automatic approval.

### FR-08 — Relations and consistent deletion (H5)

The analyst shall visualize links among the project, features/epics, stories and workflow nodes.

- **AC-08.1:** Selecting a node highlights it, its direct neighbors and their connectors while visually reducing unrelated nodes.
- **AC-08.2:** Allow neighborhood focus and supported custom relationship creation/removal.
- **AC-08.3:** Workflow deletion in either view removes the same record and incident connectors; linked stories remain and need review.
- **AC-08.4:** Story deletion removes its relationships; deleted generated stories do not immediately reappear.
- **AC-08.5:** Project deletion through Relations follows FR-01 confirmation and cleanup.

### FR-09 — Change-impact analysis (H1, H2)

The analyst shall review a replacement rule before changing the baseline.

- **AC-09.1:** Show current/proposed text and affected artifacts without mutating the baseline during preview.
- **AC-09.2:** Applying records the change and identifies review needs; reject stale proposals.
- **AC-09.3:** The sample approval above 50,000 BDT affects the story, documentation and workflow, and changes the high-value sample outcome until additional approval.
- **AC-09.4:** Make clear that unlinked downstream effects require analyst investigation; do not claim exhaustive enterprise discovery.

### FR-10 — SRS preparation and export

- **AC-10.1:** Capture version/revision, CR/Jira references, creator, reviewer and approval placeholders.
- **AC-10.2:** Include purpose, users, scope, workflow, features/stories, risks, effort and CR accumulation.
- **AC-10.3:** Include appendices for rules, traceability, questions, meeting outcomes, sources, relationships and knowledge.
- **AC-10.4:** Keep uncertain approvals/estimates visible rather than fabricating them.

### FR-11 — Persistence, recovery and portability

- **AC-11.1:** Store analysis in localStorage and originals in IndexedDB; make save/quota failures visible.
- **AC-11.2:** Detect another tab's saved update instead of silently overwriting it from a stale tab.
- **AC-11.3:** Export/import valid project JSON and reject invalid data without silently replacing saved analysis.
- **AC-11.4:** JSON carries analysis, indexed text and file references, not original bytes; explain missing originals after transfer.
- **AC-11.5:** Explain browser-data loss and the need to back up JSON and originals separately.

### FR-12 — Public showcase and reusable source

- **AC-12.1:** Explain the project, show an interactive example, open the workbench and link samples, instructions and source.
- **AC-12.2:** Allow sample use without external data, login or API keys.
- **AC-12.3:** Include an MIT license for original code, dependency licenses, setup commands and a Pages workflow.
- **AC-12.4:** Support a static repository subpath such as `/sdlc-workbench/`; exclude private server/auth dependencies and private project data.

## 5. Non-functional requirements

| ID | Requirement | Validation or boundary |
| --- | --- | --- |
| NFR-01 | Project isolation | Project-scoped analysis and original-file lookup/cleanup. Browser path namespaces are logical separation, not security boundaries. |
| NFR-02 | Honest privacy behavior | No project upload endpoint, external AI or application analytics. Host receives ordinary requests; local data is not app-encrypted. |
| NFR-03 | Recoverable failures | Visible conflicts, quotas, unsupported files and interrupted cleanup; no false saved/success message. |
| NFR-04 | Safe data handling | Validate imported structures; enforce file limits; do not execute imported markup as application code. |
| NFR-05 | Accessibility/responsiveness | Labeled controls, visible focus and keyboard diagram actions. Browser and assistive-technology audits remain required. |
| NFR-06 | Maintainability | TypeScript and automated checks cover core logic, hierarchy, SRS, relations, deletion, storage and rendering. |
| NFR-07 | Static portability | React/TypeScript/Vite output in `public-dist/` with no private backend required. |

### Prototype limits

| Resource | Limit |
| --- | --- |
| Projects | 20 |
| Features/epics per project | 24 combined |
| Stories per project | 60 |
| UML nodes per project | 60 |
| Knowledge items per project | 20 |
| Original file | 5 MB |
| Original files per project | 50 MB total |
| Analysis JSON | 1.8 MB, subject to browser quota |
| PDF text extraction | First 20 pages |

## 6. Validation and release acceptance

Run `npm run check` for TypeScript and eight suites; run `npm run build` for compilation and asset validation. These cover logic, storage fixtures and React rendering, not real-browser interaction or actual IndexedDB persistence.

Before calling a deployed release validated, complete this smoke test on its URL:

1. Inspect the sample's requirement/source links.
2. Create an empty project, a feature, an epic and a standalone story.
3. Add Markdown and an image with notes. Refresh, retrieve text and download both originals.
4. Build a guarded UML branch, preview all ten story sections and create a selected draft.
5. Connect story/container/workflow nodes and verify associated-node highlighting.
6. Change a linked guard or rule; verify the review flag.
7. Preview/apply the sample approval change; inspect the impact report and exported SRS.
8. Export/import JSON and confirm originals require separate transfer.
9. Delete a UML node from Relations, delete a project, refresh and create another.
10. Verify stale-save handling in two tabs, keyboard operation and a narrow viewport.

Pages is live only after a successful deployment produces a working URL. A workflow or expected address alone is not evidence of deployment.

## Future requirements

These are planned stages, not implemented capabilities or delivery commitments.

| ID | Stage | Required additions |
| --- | --- | --- |
| FUT-01 | Usability hardening | Browser/IndexedDB regressions, accessibility review and analyst-reviewed examples |
| FUT-02 | Optional AI/RAG | Provider choice, server-held credentials, indexing/embeddings as needed, cited answers, evaluation and uncertainty. No training claim without a defined training process. |
| FUT-03 | Shared projects | Authentication, membership, authorization, database/object storage, collaboration strategy and audited deletion |
| FUT-04 | Production operations | Tested backups/restore, migrations, monitoring, releases/rollback, retention and support ownership |
| FUT-05 | Integrations | Scoped Jira, document or design-tool connectors with user-controlled import/export |

## 7. Request traceability

| Original need | Requirements |
| --- | --- |
| H1: understand/change the business using previous documents | FR-02, FR-03, FR-09 |
| H2: interactive workflow, meeting outcomes and impacted areas | FR-04, FR-08, FR-09 |
| H3: project → feature or epic → stories; standard story/SRS writing | FR-01, FR-05, FR-06, FR-10 |
| H4: documents/images/XML/XAML/MD as project memory | FR-03, FR-11 |
| H5: connected stories/containers and associated-node highlighting | FR-08 |
| Delete projects and workflow/relation nodes | FR-01, FR-05, FR-08 |
| H6: UML informs story suggestions and content | FR-04, FR-07; FUT-02 for connected AI |
| Showcase publicly and let others use it | FR-12, NFR-07 |

Update the requirement, acceptance criteria, implementation and tests together when changing this baseline. Use repository issues and synthetic examples for proposed changes.
