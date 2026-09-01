const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Ronaldo\\Desktop\\yugidex\\src\\App.jsx', 'utf8');

let braceCount = 0;
let inString = false;
let stringChar = '';
let line = 1;
let col = 1;

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  
  if (char === '\n') {
    line++;
    col = 1;
  } else {
    col++;
  }
  
  if (!inString && (char === '"' || char === "'")) {
    inString = true;
    stringChar = char;
  } else if (inString && char === stringChar && content[i-1] !== '\\') {
    inString = false;
  }
  
  if (!inString) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    
    if (braceCount > 20) {
      console.log('High brace count:', braceCount, 'at line', line, 'col', col);
    }
  }
}

console.log('Final brace count:', braceCount);