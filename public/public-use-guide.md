# Trace — public browser workbench

A portfolio project by Amit Paul, Business Analyst.

## First use

1. Select **Open workbench** to reach **Projects**. Choose **Create project** for your own work, or **Open project** on the payment sample. Then select Requirements to inspect the sample rules.
2. Inspect its rules and source passages. In Workflow, select nodes, edit their responsible role and linked rules, connect guarded paths, and arrange swimlanes.
3. Select **Suggest stories**, inspect a candidate's flow path and all ten SRS sections, select drafts, and create them under the project, a feature, or an epic.
4. In User stories, refine the content and save the reviewed story. In Relations, select a node to highlight its direct associated nodes and connectors.
5. In Change impact, load the sample additional approval above 50,000 BDT. Select **Analyze impact**, review the before/after rule and linked artifacts, then **Apply to baseline** when ready. Update the flagged workflow and written stories.
6. In Documentation, fill the SRS metadata and use **Export analysis**. **Export all projects** downloads a JSON backup of the analysis. Download originals separately from Knowledge.

## Your own process

Use Projects → Create project. Create a feature, epic, or project-level story. Add reference documents, images, XML/XAML, Markdown and notes in Knowledge. Import a text-based brief in Requirements and select Analyze brief to establish a rule baseline. A Knowledge attachment alone does not become a requirement.

PDF (text-based, up to 20 pages), DOCX and text formats can be indexed. Images and scanned documents need notes/transcriptions; OCR is not connected. XML and diagrams are read as text, never executed.

## Where data lives

- Analysis is saved in this browser's localStorage. Original attachments use IndexedDB. Each deployed repository path has its own storage namespace.
- This build has no project server, login, external AI service, analytics or telemetry. It does not call the private hosted workbench APIs. The hosting provider receives ordinary website requests.
- Visitors have independent browser workspaces. People using the same browser profile can access its local copies. Storage is not encrypted by this application.
- Clearing site data or losing the browser profile removes the local copies. Export JSON and originals for a backup. JSON preserves indexed text and original-file references, not the original file bytes. Reattach originals after importing on another browser.
- Another tab's save is detected and stops an older snapshot from overwriting it. Export edits and reload the saved version after a conflict.

## Deletion

Delete a project from its card, header, or project relation node. Confirmation removes its analysis and local originals. File cleanup can be retried through Finish deletion if interrupted.

Delete a UML node from Workflow or Relations to remove the same node and its connectors. Linked stories remain marked for review. Delete a story node to remove that story; deleting a feature/epic moves its children to the project unless you choose the explicit story cascade.

## Current scope

Source text and notes use keyword retrieval. Story suggestions use local templates grounded in the flow, actor roles, guards and rules. This is not model training or a connected LLM/RAG service. BA review is required. Shared editing and cloud synchronization are not part of the public build.

Limits: 20 projects, 24 features/epics, 60 stories and 60 UML nodes per project; 20 knowledge items, 5 MB per file and 50 MB of originals per project. Analysis JSON is capped at 1.8 MB and also depends on available browser storage.

## Run on your PC

From the public repository, use Node.js 22.13 or newer:

```bash
npm install
npm run dev
```

Open the loopback URL printed by Vite. No database, API key or sign-in setup is required. To build static files, run `npm run build`; `npm run preview` serves that build locally.

The repository's README explains GitHub Pages publication. Public source and static assets do not include the private hosted project's data or files.
