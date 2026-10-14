import {spawnSync} from 'node:child_process';
const cases=['core-flow','document-and-canvas','srs-template','projects-and-hierarchy','knowledge-and-relations','deletion-and-uml','public-storage','public-render'];
const typecheck=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','--noEmit'],{stdio:'inherit'});if(typecheck.status!==0)process.exit(typecheck.status||1);
for(const name of cases){const result=spawnSync(process.execPath,['--experimental-strip-types',`tests/${name}.mjs`],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
