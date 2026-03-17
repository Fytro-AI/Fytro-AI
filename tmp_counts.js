const fs = require('fs');
const appLines = fs.readFileSync('appExerciseNames.txt','utf16le').replace(/^\uFEFF/,'').split(/\r?\n/).filter(l=>l.trim());
const freeKeys = fs.readFileSync('freeDbKeys.txt','utf16le').replace(/^\uFEFF/,'').split(/\r?\n/).filter(l=>l.trim());
console.log('counts', appLines.length, freeKeys.length);
