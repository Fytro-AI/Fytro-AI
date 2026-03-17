const fs = require('fs');
const txt = fs.readFileSync('appExerciseNames.txt','utf16le');
console.log(txt.split(/\r?\n/).slice(0,5));
