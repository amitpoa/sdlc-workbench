declare const __TRACE_PUBLIC__: boolean;
declare const __TRACE_BASE__: string;
declare const __TRACE_REPOSITORY__: string;

export const PUBLIC_DEMO=typeof __TRACE_PUBLIC__!=='undefined'&&__TRACE_PUBLIC__;
export function assetUrl(path:string){const base=typeof __TRACE_BASE__==='undefined'?'/':__TRACE_BASE__;const relative=base+path.replace(/^\//,'');return !PUBLIC_DEMO||typeof document==='undefined'?relative:new URL(relative,document.baseURI).href;}
export function sourceUrl(){return typeof __TRACE_REPOSITORY__!=='undefined'&&__TRACE_REPOSITORY__?__TRACE_REPOSITORY__:'https://github.com/amitpoa';}
