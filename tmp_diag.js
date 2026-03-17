const fs = require('fs');
const readUtf16Lines = (p) => {
  const raw = fs.readFileSync(p, 'utf16le');
  return raw.replace(/^\uFEFF/, '').split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
};
const freeKeys = readUtf16Lines('freeDbKeys.txt');
console.log('free', freeKeys.length);
const tokens = s => (s.toLowerCase().match(/[a-z0-9]+/g) || []).filter(t=>t.length>1);
for (let i=0;i<10;i++) {
  console.log(i, freeKeys[i], tokens(freeKeys[i]));
}
console.log('done');
