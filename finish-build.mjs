import { renameSync, copyFileSync } from 'node:fs';
renameSync('dist/source.html', 'dist/index.html');
copyFileSync('favicon.svg', 'dist/favicon.svg');
