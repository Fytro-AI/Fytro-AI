const fs = require('fs');
const raw = fs.readFileSync('freeDbKeys.txt','utf16le');
console.log('len', raw.length);
