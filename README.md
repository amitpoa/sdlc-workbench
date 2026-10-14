# Trace · SDLC Workbench

**Turn business requirements into connected workflows, user stories and reviewable documentation.**

A browser-based Business Analysis workbench by [Amit Paul](https://github.com/amitpoa). This portfolio project follows the analysis journey from an existing business process to a proposed change: capture evidence, model the workflow, break down delivery, and inspect the impact before updating the baseline.

[Requirements](REQUIREMENTS.md) · [Usage guide](public/public-use-guide.md) · [Sample requirements](public/samples/payment-requirements.md) · [Sample SRS](public/samples/sample-SRS.md) · [Report an issue](https://github.com/amitpoa/sdlc-workbench/issues)

## What you can do

| Workspace | Capabilities |
| --- | --- |
| Projects | Create, switch, import/export and delete separate workbenches. |
| Requirements | Import a brief, inspect source passages, refine business rules and track review status. |
| Knowledge | Keep documents, images, XML/XAML, Markdown and analyst notes under the project; search indexed text. |
| Workflow | Arrange a UML activity diagram with roles, swimlanes, decisions and guarded connectors. Capture linked meeting outcomes. |
| Features & epics | Start with either a feature or an epic, then add stories. Stories can also belong directly to a project. |
| User stories | Preview flow-based suggestions, select drafts and edit each story in the ten-section SRS format. |
| Relations | Connect project items, highlight associated nodes and manage workflow/story/container deletion. |
| Change impact | Preview a replacement rule, review affected artifacts and apply the change to the baseline. |
| Documentation | Complete SRS metadata, risks and estimates; export analysis and traceability links. |

**Current scope:** a usable prototype with keyword retrieval and deterministic, source-aware story drafts. There is no connected LLM, vector database, OCR or model training. Generated content needs analyst review. Visitors have independent browser workspaces; shared editing and cloud synchronization are future work.

## Run on your PC

Install Git and Node.js **22.13 or newer**, then run:

```bash
git clone https://github.com/amitpoa/sdlc-workbench.git
cd sdlc-workbench
npm install
npm run dev
```

Open the local URL printed by Vite. No account, database or API key is required. Keep the terminal running while using the development server; stop it with `Ctrl+C`.

For a reproducible install using the included pnpm lockfile:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Use either install path. Sharing these commands lets someone run their own copy; it does not keep your PC running as a public server.

## Try the full workflow

1. Select **Try the workbench**. Inspect the sample payment project's requirements and source evidence.
2. In **Workflow**, move nodes, edit roles and linked rules, and connect branches with guards.
3. Select **Suggest stories**, inspect content and source links, choose a project/feature/epic parent, and create selected drafts.
4. Refine the ten sections in **User stories**. In **Relations**, select a node to highlight its directly associated nodes and connectors.
5. In **Change impact**, load the sample additional approval above **50,000 BDT**. Select **Analyze impact**, review the rule and affected artifacts, then **Apply to baseline**. Review flagged stories and workflow steps.
6. In **Documentation**, complete metadata and export the SRS. Use **Export all projects** for an analysis backup and download original attachments separately.

For your own business process, select **Projects → Create project**. Add reference files in **Knowledge**, then import/analyze a brief in **Requirements** to establish the rule baseline. Attaching a document alone does not turn it into a requirement.

### Delivery hierarchy

| Parent | Children |
| --- | --- |
| Project | Features, epics and standalone stories |
| Feature | Multiple user stories |
| Epic | Multiple user stories |

A feature and an epic are alternative containers at the same level; creating both is optional. Cross-links describe relationships without changing a story's parent.

### Story writing format

Each story contains **User Story**, **User Journey**, **Actors**, **Scope**, **Pre-condition**, **Impacted Areas**, **Mock-up/ Prototypes**, **Requirements**, **Acceptance Criteria**, and **Exceptions**. The narrative uses “As a …, I want to …, so I can …”. Unconfirmed details remain `TBD`.

## Sample material

- [Payment requirements](public/samples/payment-requirements.md): a brief for trying ingestion.
- [Payment project JSON](public/samples/payment-project.json): an importable example workspace.
- [Example SRS](public/samples/sample-SRS.md): a sample output.
- [Usage guide](public/public-use-guide.md): first use, storage, deletion and recovery.
- [Product requirements](REQUIREMENTS.md): scope, acceptance criteria and the roadmap.

The payment process is illustrative. Its simulator covers selected payment scenarios; it does not execute arbitrary business processes.

## Publish with GitHub Pages

The repository includes [a deployment workflow](.github/workflows/pages.yml).

1. Open **Settings → Pages → Build and deployment** and choose **GitHub Actions** as the source.
2. Push to the default branch, or select **Actions → Publish Trace to GitHub Pages → Run workflow**.
3. Wait for the checks, build and deployment to succeed. Open the URL returned by the deployment.

The expected default address after successful deployment is `https://amitpoa.github.io/sdlc-workbench/`. This is a deployment target, not a claim that Pages is already enabled.

The build derives its asset path and repository link from `GITHUB_REPOSITORY`. Forks use their own owner and repository name. The `#workbench` route needs no server route rewriting. Other static hosts can set `TRACE_BASE_PATH` and `TRACE_REPOSITORY_URL`.

Setup reference: [Vite static deployment guide](https://vite.dev/guide/static-deploy.html#github-pages).

## Data, privacy and backups

| Item | Public prototype behavior |
| --- | --- |
| Project analysis | Browser localStorage, under the application's path namespace |
| Original attachments | Browser IndexedDB |
| Retrieval and drafting | Local source text, notes, rules and UML flow |
| Accounts and sharing | No login or shared project server; exchange exports manually |
| Backup | Projects JSON **and** separately downloaded originals; JSON does not contain original file bytes |
| Conflicting tabs | Detect another tab's save and stop a stale overwrite; export edits and reload |
| Deletion | Confirm project deletion; interrupted file cleanup can be retried |

Clearing browser data or losing the browser profile removes local copies. Storage is not application-encrypted, and people using the same browser profile can access it. Path namespaces are logical separation, not security boundaries between sites on the same origin. The hosting provider receives ordinary website requests; this build has no application endpoint for uploading project data and no connected external AI service.

The separately hosted private version and its cloud data are not included. Publishing this code does not change that site's access settings or synchronize its data.

Limits: **20 projects**; **24 features/epics**, **60 stories**, **60 UML nodes** and **20 knowledge items** per project; **5 MB** per original and **50 MB** of originals per project. Analysis JSON is capped at **1.8 MB**, subject to browser quotas. PDF text extraction processes up to **20 pages**. Images and scanned documents need notes or transcriptions.

## Development and validation

```bash
npm run check
npm run build
npm run preview
```

`check` runs TypeScript and eight suites covering the core flow, documents/canvas, SRS format, hierarchy, knowledge/relations, deletion/UML, public storage and React rendering. `build` creates `public-dist/` and checks asset paths and exclusion of private API/auth dependencies from compiled assets.

You can also serve the static output with:

```bash
python3 -m http.server 8080 --directory public-dist
```

Open the server URL; opening `index.html` with `file://` is unsupported.

Automated checks cover logic and rendering fixtures. Actual browser interactions, IndexedDB persistence and a successful Pages deployment still need a browser/deployment smoke test. Try creating a project, adding Markdown and an image, refreshing, downloading both originals, generating a story, changing a linked guard, checking its review flag, deleting the project and creating another.

### Repository map

| Path | Purpose |
| --- | --- |
| `public-app/` | Showcase, browser entry and Vite configuration |
| `app/`, `components/` | Workbench screens, diagrams and browser save hook |
| `lib/` | Analysis, traceability, document readers and browser storage |
| `public/samples/` | Example inputs, project and SRS |
| `public/document-reader/` | Local reader assets and licenses |
| `tests/`, `scripts/` | Automated checks and build validation |
| `.github/workflows/pages.yml` | Pages deployment |

## Roadmap and contributions

Next stages are analyst evaluation, browser/accessibility testing, optional cited AI retrieval, and a separate authenticated service for shared projects. Production team use also needs membership permissions, durable storage, tested backups/restore, monitoring and release controls. See [future requirements](REQUIREMENTS.md#future-requirements).

Issues and pull requests are welcome. Describe expected behavior, reproduction steps and a synthetic example. Avoid including confidential business documents. Run checks before submitting a code change.

## License and acknowledgements

Original Trace code is available under the [MIT License](LICENSE). Vendored PDF.js, JSZip and shadcn assets retain their included licenses. [Marginal](https://shukdevtroy.github.io/Marginal/) inspired the showcase's presentation structure; implementation and assets were created independently.
