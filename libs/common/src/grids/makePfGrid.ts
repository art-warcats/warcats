import {gameTiles, PF} from '../constants';
import {gameGrid} from './constants';
import {GameSpace} from './GameSpace';

export type PathfindingGrid = {
  setWalkableAt: (i: number, j: number, walkable: boolean) => void;
  isWalkableAt: (i: number, j: number) => boolean;
};

export function makePfGrid(allowedGameSpaces: GameSpace[]) {
  const pfGrid = new PF.Grid(
    gameTiles.width,
    gameTiles.height,
  ) as PathfindingGrid;

  for (let i = 0; i < gameTiles.width; i++) {
    for (let j = 0; j < gameTiles.height; j++) {
      if (allowedGameSpaces.includes(gameGrid[j][i])) {
        pfGrid.setWalkableAt(i, j, true);
      } else {
        pfGrid.setWalkableAt(i, j, false);
      }
    }
  }

  return pfGrid as PathfindingGrid;
}
