const fs = require('fs');
const appLines = fs.readFileSync('appExerciseNames.txt','utf16le').replace(/^\uFEFF/,'').split(/\r?\n/).filter(l=>l.trim()).slice(0,1);
const freeKeys = fs.readFileSync('freeDbKeys.txt','utf16le').replace(/^\uFEFF/,'').split(/\r?\n/).filter(l=>l.trim()).slice(0,10);
const freeNorms = freeKeys.map(k=>k.toLowerCase().replace(/[^a-z0-9]/g,''));
function tokens(s){ return (s.toLowerCase().match(/[a-z0-9]+/g)||[]).filter(t=>t.length>1); }
console.log('start');
const appTokens = tokens(appLines[0]);
let matched=0;
for(let i=0;i<freeNorms.length;i++){
  const freeNorm = freeNorms[i];
  for(const t of appTokens){ if(freeNorm.includes(t)) matched++; }
}
console.log('matched', matched);
