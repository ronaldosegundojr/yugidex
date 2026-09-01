const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Ronaldo\\Desktop\\yugidex\\src\\App.jsx', 'utf8');

let braceCount = 0;
let parenCount = 0;
let inString = false;
let stringChar = '';

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  
  if (!inString && (char === '"' || char === "'")) {
    inString = true;
    stringChar = char;
  } else if (inString && char === stringChar && content[i-1] !== '\\') {
    inString = false;
  }
  
  if (!inString) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
    
    if (braceCount < 0) {
      console.log('Negative brace count at position', i, 'char:', char);
      console.log('Context:', content.substring(Math.max(0, i-50), i+50));
      break;
    }
  }
}

console.log('Final brace count:', braceCount);
console.log('Final paren count:', parenCount);