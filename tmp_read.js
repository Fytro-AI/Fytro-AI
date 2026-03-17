const fs = require('fs');
const txt = fs.readFileSync('freeDbKeys.txt','utf8');
console.log(txt.split(/\r?\n/).slice(0,5));
