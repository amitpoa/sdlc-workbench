'use client';
import { useEffect,useRef,useState } from 'react';
import { sampleProjects,deleteProjectFromCollection,type ProjectCollection } from '@/lib/workbench';
import { localCollectionStore,purgeOriginals,browserScope } from '@/lib/browser-store';

export function useSavedProjects(){
 const [collection,setCollection]=useState(sampleProjects),[ready,setReady]=useState(false),[status,setStatus]=useState('Loading browser projects'),[error,setError]=useState('');
 const latest=useRef(collection),expected=useRef<string|null>(null),saved=useRef<ProjectCollection|null>(null),loaded=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);latest.current=collection;
 function report(e:unknown){setError((e as Error).message);setStatus('Not saved');}
 async function flush(){if(!loaded.current)throw new Error('Browser data could not load. Export your work and reload before saving.');clearTimeout(timer.current);if(latest.current===saved.current)return;try{setStatus('Saving in browser');expected.current=localCollectionStore().save(latest.current,expected.current);saved.current=latest.current;setError('');setStatus('Saved in this browser');}catch(e){report(e);throw e;}}
 async function deleteProject(id:string){const next=latest.current.projects.some(p=>p.id===id)?deleteProjectFromCollection(latest.current,id):latest.current;latest.current=next;setCollection(next);try{await flush();await purgeOriginals(id);const clean={...latest.current,pendingProjectDeletes:(latest.current.pendingProjectDeletes||[]).filter(x=>x!==id)};latest.current=clean;setCollection(clean);await flush();}catch(e){report(e);throw e;}}
 useEffect(()=>{try{const data=localCollectionStore().read(),next=data.collection||sampleProjects();expected.current=data.raw;latest.current=next;saved.current=data.collection?next:null;setCollection(next);loaded.current=true;setStatus(data.collection?'Saved in this browser':'Sample ready');}catch(e){report(e);}setReady(true);},[]);
 useEffect(()=>{if(!ready||!loaded.current)return;if(collection===saved.current)return;setStatus('Changes pending');clearTimeout(timer.current);timer.current=setTimeout(()=>{void flush().catch(()=>{});},450);return()=>clearTimeout(timer.current);},[collection,ready]);
 useEffect(()=>()=>{clearTimeout(timer.current);if(loaded.current&&latest.current!==saved.current){try{expected.current=localCollectionStore().save(latest.current,expected.current);saved.current=latest.current;}catch{console.warn('Trace could not save pending browser edits on navigation. Export a backup while the workbench is open.');}}},[]);
 useEffect(()=>{function changed(e:StorageEvent){if(e.key===browserScope(document.baseURI)&&e.newValue!==expected.current)report(new Error('Another tab changed these projects. Export your edits, then reload the saved version.'));}window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed);},[]);
 useEffect(()=>{function before(e:BeforeUnloadEvent){if(status==='Changes pending'||status==='Not saved'||status==='Saving in browser'){e.preventDefault();e.returnValue='';}}window.addEventListener('beforeunload',before);return()=>window.removeEventListener('beforeunload',before);},[status]);
 return {collection,setCollection,ready,status,error,flush,deleteProject};
}
