import {gameTiles} from '../constants';
import {GameSpace} from './GameSpace';

export const isValidGrid = (grid: GameSpace[][]) => {
  if (grid.length != gameTiles.height) {
    throw new Error('Grid does not match height');
  }
  let i = 0;
  for (const inner of grid) {
    if (inner.length != gameTiles.width) {
      throw new Error('Grid does not match width' + i + ' ' + inner.length);
    }
    i++;
  }
};
