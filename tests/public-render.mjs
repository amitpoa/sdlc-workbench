import {createRequire} from 'node:module';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url),viteRequire=createRequire(require.resolve('vite/package.json'));let esbuild;try{esbuild=require('esbuild');}catch{esbuild=viteRequire('esbuild');}
const root=resolve(import.meta.dirname,'..'),file=resolve(root,'.sites-runtime/public-render.cjs');mkdirSync(resolve(root,'.sites-runtime'),{recursive:true});
await esbuild.build({entryPoints:[resolve(root,'tests/public-render.tsx')],outfile:file,bundle:true,platform:'node',packages:'external',format:'cjs',jsx:'automatic',alias:{'@/components/use-saved-projects':resolve(root,'components/use-local-projects.ts'),'@':root},define:{__TRACE_PUBLIC__:'true',__TRACE_BASE__:'"/ba-sdlc-workbench/"',__TRACE_REPOSITORY__:'""'},plugins:[{name:'browser-project-fixture',setup(b){b.onLoad({filter:/use-(?:saved|local)-projects\.ts$/},()=>({loader:'ts',resolveDir:root,contents:`import {sampleProjects} from '@/lib/workbench';export function useSavedProjects(){return {collection:sampleProjects(),setCollection:()=>{},ready:true,status:'Saved in this browser',error:'',flush:async()=>{},deleteProject:async()=>{}};}`}));}}]});
require(file);
