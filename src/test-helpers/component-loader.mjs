import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '..');
const cacheDir = path.resolve(srcDir, '..', 'node_modules', '.cache', 'compiled-src');

export function compileAllSrc() {
  fs.mkdirSync(cacheDir, { recursive: true });

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'test-helpers' || entry.name === '.next' || entry.name === 'node_modules') continue;
        walk(fullPath);
      } else if (entry.name.endsWith('.tsx') || (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts'))) {
        const relPath = path.relative(srcDir, fullPath);
        const outRelPath = relPath.replace(/\.tsx?$/, '.mjs');
        const outFullPath = path.join(cacheDir, outRelPath);
        fs.mkdirSync(path.dirname(outFullPath), { recursive: true });

        let content = fs.readFileSync(fullPath, 'utf-8');

        // Replace @/ imports with absolute file URLs to compiled cache
        content = content.replace(/from\s+['"]@\/([^'"]+)['"]/g, (match, importPath) => {
          let targetPath = path.join(cacheDir, importPath);
          if (!targetPath.endsWith('.mjs')) targetPath += '.mjs';
          return `from ${JSON.stringify(pathToFileURL(targetPath).href)}`;
        });
        content = content.replace(/import\(['"]@\/([^'"]+)['"]\)/g, (match, importPath) => {
          let targetPath = path.join(cacheDir, importPath);
          if (!targetPath.endsWith('.mjs')) targetPath += '.mjs';
          return `import(${JSON.stringify(pathToFileURL(targetPath).href)})`;
        });

        const transpiled = ts.transpileModule(content, {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
            jsx: ts.JsxEmit.ReactJSX,
          },
        });

        fs.writeFileSync(outFullPath, transpiled.outputText, 'utf-8');
      }
    }
  }

  walk(srcDir);
}

compileAllSrc();

export async function loadCompiledModule(relSrcPath) {
  const cleanPath = relSrcPath.replace(/^src[\\\/]/, '').replace(/\.tsx?$/, '.mjs');
  const targetPath = path.join(cacheDir, cleanPath);
  return import(pathToFileURL(targetPath).href);
}
