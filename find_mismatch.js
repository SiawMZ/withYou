const fs = require('fs');

const fileName = 'app/profile/page.tsx';
const content = fs.readFileSync(fileName, 'utf8');
const lines = content.split('\n');

let balance = 0;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '{') balance++;
        if (char === '}') {
            balance--;
            if (balance === 0) {
                console.log(`Balance hit 0 at line ${i + 1}, column ${j + 1}`);
            }
        }

        if (balance < 0) {
            console.log(`Mismatch found at line ${i + 1}, column ${j + 1}`);
            process.exit(1);
        }
    }
}

if (balance !== 0) {
    console.log(`Final balance is ${balance} (should be 0). Positive means missing '}', negative means extra '}'.`);
} else {
    console.log("Braces are balanced.");
}
