import { Router } from 'express';
import { readdirSync } from 'fs';

const PATH_ROUTER = `${__dirname}`;
const router = Router();

const cleanFileName = (fileName: string) => {
  const fileNameWithoutExtension = fileName.split('.').shift();
  const file = fileNameWithoutExtension?.replace('Route', '').toLowerCase();
  return file;
};

readdirSync(PATH_ROUTER)
  .filter((fileName) => fileName !== 'index.ts' && fileName !== 'index.js')
  .forEach((fileName) => {
    const cleanName = cleanFileName(fileName);
    console.log(cleanName);

    // Use the exact file name without extension for import
    const fileNameWithoutExt = fileName.replace(/\.(ts|js)$/, '');
    const importName = `./${fileNameWithoutExt}`;

    import(importName)
      .then((moduleRouter) => {
        router.use(`/${cleanName}`, moduleRouter.router);
      })
      .catch((error) => {
        console.error(`Error loading route ${cleanName}:`, error);
      });
  });

export { router };
