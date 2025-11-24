const fs = require('fs');
const ts = require('typescript');

const fileName = 'app/profile/page.tsx';
const sourceCode = fs.readFileSync(fileName, 'utf8');

const sourceFile = ts.createSourceFile(
    fileName,
    sourceCode,
    ts.ScriptTarget.Latest,
    true
);

const diagnostics = [];
// Basic check for parse errors
if (sourceFile.parseDiagnostics && sourceFile.parseDiagnostics.length > 0) {
    sourceFile.parseDiagnostics.forEach(d => {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(d.start);
        console.log(`Error at ${line + 1}:${character + 1}: ${d.messageText}`);
    });
} else {
    console.log("No parse errors found.");
}
