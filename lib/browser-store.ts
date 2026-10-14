import { exportProjects, restoreProjects, type ProjectCollection } from './workbench';

export type LocalStorageApi=Pick<Storage,'getItem'|'setItem'>;
export function browserScope(baseUri:string){return 'trace.browser.v1:'+new URL('.',baseUri).pathname;}
export function createCollectionStore(storage:LocalStorageApi,key:string){
 return {
  read(){const raw=storage.getItem(key);return {raw,collection:raw?restoreProjects(raw):null};},
  save(collection:ProjectCollection,expected:string|null){
   if(storage.getItem(key)!==expected)throw new Error('Another tab changed these projects. Export your edits, then reload the saved version.');
   const raw=exportProjects(collection);restoreProjects(raw);
   if(new TextEncoder().encode(raw).length>1_800_000)throw new Error('Browser analysis reached 1.8 MB. Export a backup and reduce the indexed text.');
   try{storage.setItem(key,raw);}catch{throw new Error('Browser storage is full or unavailable. Export your work before leaving.');}return raw;
  }
 };
}
export function localCollectionStore(){return createCollectionStore(window.localStorage,browserScope(document.baseURI));}

type LocalFile={id:string;projectId:string;name:string;mime:string;size:number;addedAt:string;blob:Blob};
const databases=new Map<string,Promise<IDBDatabase>>();
function database(){
 const name=browserScope(document.baseURI)+':originals';if(databases.has(name))return databases.get(name)!;
 const promise=new Promise<IDBDatabase>((resolve,reject)=>{if(!window.indexedDB){reject(new Error('This browser cannot store original files. Use indexed text and export JSON instead.'));return;}const request=indexedDB.open(name,1);request.onupgradeneeded=()=>{const store=request.result.createObjectStore('files',{keyPath:'id'});store.createIndex('projectId','projectId');};request.onsuccess=()=>resolve(request.result);request.onerror=()=>{databases.delete(name);reject(new Error('Browser file storage could not open.'));};request.onblocked=()=>{databases.delete(name);reject(new Error('Close other Trace tabs and retry opening browser file storage.'));};});databases.set(name,promise);return promise;
}
async function fileRequest<T>(mode:IDBTransactionMode,action:(store:IDBObjectStore)=>IDBRequest<T>){const db=await database();return new Promise<T>((resolve,reject)=>{const tx=db.transaction('files',mode),request=action(tx.objectStore('files'));let value:T;request.onsuccess=()=>{value=request.result;};tx.oncomplete=()=>resolve(value);tx.onabort=tx.onerror=()=>reject(new Error('Browser file storage failed. Check available disk space and retry.'));});}
const MIME:Record<string,string>={pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',doc:'application/msword',md:'text/plain',txt:'text/plain',xml:'text/plain',xaml:'text/plain',drawio:'text/plain',svg:'text/plain',json:'text/plain',csv:'text/plain',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'};
export function checkLocalFile(file:Pick<File,'name'|'size'>){const name=file.name.replace(/[\\/\u0000-\u001f]/g,'_').slice(0,140),mime=MIME[name.split('.').pop()?.toLowerCase()||''];if(!mime)throw new Error('Use a document, Markdown, XML/XAML, diagram, raster image, or supported Office attachment.');if(file.size>5*1024*1024)throw new Error('Use a file below 5 MB.');return {name,mime};}
export function assertFileCapacity(existing:Pick<LocalFile,'size'>[],size:number){if(existing.length>=20)throw new Error('Use up to 20 original files per project.');if(existing.reduce((sum,f)=>sum+f.size,0)+size>50*1024*1024)throw new Error('Use up to 50 MB of original files per project.');}
function projectPresent(id:string){return localCollectionStore().read().collection?.projects.some(p=>p.id===id)===true;}
export async function storeOriginal(projectId:string,file:File){
 const checked=checkLocalFile(file);if(!projectPresent(projectId))throw new Error('Save the project before attaching files.');const db=await database(),record:LocalFile={...checked,id:'local-'+crypto.randomUUID(),projectId,size:file.size,addedAt:new Date().toISOString(),blob:file};
 await new Promise<void>((resolve,reject)=>{const tx=db.transaction('files','readwrite'),store=tx.objectStore('files'),request=store.index('projectId').getAll(projectId);let failure:Error|undefined;request.onsuccess=()=>{try{assertFileCapacity(request.result as LocalFile[],file.size);store.put(record);}catch(e){failure=e as Error;tx.abort();}};tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(failure||new Error('Original file could not be saved in this browser. Check available storage and retry.'));});
 if(!projectPresent(projectId)){await removeOriginal(projectId,record.id);throw new Error('The project was deleted while its attachment was being saved.');}
 const {blob,projectId:scope,...metadata}=record;void blob;void scope;return metadata;
}
export async function originalBlob(projectId:string,id:string){const record=await fileRequest<LocalFile|undefined>('readonly',store=>store.get(id));if(!record||record.projectId!==projectId)throw new Error('This original is not available in this browser. JSON imports include indexed text, but original files must be attached again on another browser.');return record.blob;}
export async function removeOriginal(projectId:string,id:string){const record=await fileRequest<LocalFile|undefined>('readonly',store=>store.get(id));if(record&&record.projectId!==projectId)throw new Error('The attachment belongs to another project.');if(record)await fileRequest('readwrite',store=>store.delete(id));}
export async function purgeOriginals(projectId:string){const db=await database();await new Promise<void>((resolve,reject)=>{const tx=db.transaction('files','readwrite'),store=tx.objectStore('files'),cursor=store.index('projectId').openKeyCursor(IDBKeyRange.only(projectId));cursor.onsuccess=()=>{const next=cursor.result;if(next){store.delete(next.primaryKey);next.continue();}};tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(new Error('Project removed, but browser attachment cleanup is pending. Retry deletion.'));});}
