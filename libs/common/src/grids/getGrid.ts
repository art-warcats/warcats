import {GameSpace} from './GameSpace';
import {makePfGrid} from './makePfGrid';
import {MobilityType} from './MobilityType';

export function getGrid(gridType: MobilityType) {
  switch (gridType) {
    case MobilityType.Air:
      return makePfGrid([
        GameSpace.field,
        GameSpace.forest,
        GameSpace.mountain,
        GameSpace.road,
        GameSpace.building,
        GameSpace.water,
      ]);
    case MobilityType.Land:
      return makePfGrid([
        GameSpace.field,
        GameSpace.forest,
        GameSpace.mountain,
        GameSpace.road,
        GameSpace.building,
      ]);
  }
}
