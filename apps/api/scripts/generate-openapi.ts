import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { openApiDocument } from '../src/docs/openapi.js';

const outFile = resolve(import.meta.dirname, '../openapi.json');

writeFileSync(outFile, JSON.stringify(openApiDocument, null, 2) + '\n');

console.log(`OpenAPI escrito en ${outFile}`);
