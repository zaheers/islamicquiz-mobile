const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(srcDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    if (content.includes("const { activeColors } = useTheme();\n    const colors = { sg: activeColors };")) {
        content = content.replace(
            "const { activeColors } = useTheme();\n    const colors = { sg: activeColors };",
            "const { activeColors, colors } = useTheme();"
        );
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log(`Fixed colors extraction in ${file}`);
    }
});
