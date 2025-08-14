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
  .filter((fileName) => fileName !== 'index.ts')
  .forEach((fileName) => {
    const cleanName = cleanFileName(fileName);
    console.log(cleanName);

    const importName = cleanName ? `./${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)}Route` : '';
    import(importName)
      .then((moduleRouter) => {
        router.use(`/${cleanName}`, moduleRouter.router);
      })
      .catch((error) => {
        console.error(`Error loading route ${cleanName}:`, error);
      });
  });

export { router };
