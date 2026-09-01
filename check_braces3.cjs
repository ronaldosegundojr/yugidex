const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Ronaldo\\Desktop\\yugidex\\src\\App.jsx', 'utf8');
const lines = content.split('\n');

let braceCount = 0;
let inString = false;
let stringChar = '';

for (let lineNum = 0; lineNum < lines.length; lineNum++) {
  const line = lines[lineNum];
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar && line[i-1] !== '\\') {
      inString = false;
    }
    
    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }
  }
  
  if (braceCount > 15) {
    console.log(`Line ${lineNum + 1}: braceCount=${braceCount} | ${line.trim().substring(0, 80)}`);
  }
}

console.log('Final brace count:', braceCount);