import {promises as fs} from 'fs';
import * as path from 'path';

const filesDir = './apps/www/public/game/animatedcats/';
const colors = ['Blue', 'Rust', 'Tan', 'Grey'];

async function renameFilesInDirectory(dir: string) {
  try {
    const files = await fs.readdir(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stats = await fs.stat(fullPath);

      if (stats.isFile() && file.startsWith('War_Cats_')) {
        let newName = '';

        let newFile = file;
        for (const color of colors) {
          if (file.includes(color)) {
            newFile = newFile.replace('-' + color, '');
          }
        }

        const item = newFile
          .replace('War_Cats_', '') // Remove 'War_Cats_'
          .replace(/_idle/, '') // Remove '_idle'
          .replace(/_walk/, '') // Remove '_idle'
          .replace('_', '')
          .replace('.png', '')
          .toLowerCase(); // Convert to lowercase

        newName += item;

        let foundColor = false;

        for (const color of colors) {
          if (file.includes(color)) {
            newName += '-' + color.toLowerCase();
            foundColor = true;
          }
        }
        if (!foundColor) {
          newName += '-white';
        }

        if (file.includes('idle')) {
          newName += '-idle';
        } else if (file.includes('walk')) {
          newName += '-walk';
        }
        newName += '.png';

        const newFullPath = path.join(dir, newName);
        await fs.rename(fullPath, newFullPath);
        console.log(`Renamed ${file} to ${newName}`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

renameFilesInDirectory(filesDir);
