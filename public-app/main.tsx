import { useEffect,useState,lazy,Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import Showcase from './showcase';
import '@/app/globals.css';
import './showcase.css';
const WorkbenchEntry=lazy(()=>import('./workbench-entry'));

export function PublicApp(){
 const [working,setWorking]=useState(()=>typeof window!=='undefined'&&window.location.hash==='#workbench');
 useEffect(()=>{const changed=()=>setWorking(window.location.hash==='#workbench');window.addEventListener('hashchange',changed);return()=>window.removeEventListener('hashchange',changed);},[]);
 useEffect(()=>{const anchor=window.location.hash.slice(1);if(anchor&&anchor!=='home'&&anchor!=='workbench')document.getElementById(anchor)?.scrollIntoView();else window.scrollTo({top:0,behavior:'instant'});if(!working&&anchor==='home')document.getElementById('showcase-title')?.focus({preventScroll:true});},[working]);
 function launch(){window.location.hash='workbench';}
 return working?<Suspense fallback={<div className="showcase-loading" role="status">Opening your projects…</div>}><WorkbenchEntry onExit={()=>{window.location.hash='home';}}/></Suspense>:<Showcase onLaunch={launch}/>;
}
const root=typeof document==='undefined'?null:document.getElementById('root');if(root)createRoot(root).render(<PublicApp/>);
