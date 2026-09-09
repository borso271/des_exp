import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
for(const file of ['showcase/renderers','showcase/vendor','showcase/schema.js','showcase/fallback.js'])if(fs.existsSync(file))throw new Error(`Superseded showcase implementation remains: ${file}`);
execFileSync(process.execPath,['--test','tests/showcase.test.js','tests/showcase-editor.test.js'],{stdio:'inherit'});
