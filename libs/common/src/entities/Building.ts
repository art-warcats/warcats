import {
  BuildingPath,
  BuildingTeam,
  greyBuildings,
  purpleBuildings,
  redBuildings,
} from '../buildings';
import {GameEntity} from '../abstracts';
import {MapPosition} from '..';

export interface IBuilding {
  _id: string;
  path: BuildingPath;
  position: MapPosition;
  health: number;
  didSpawn: boolean;
}

export class Building
  extends GameEntity<BuildingPath, BuildingTeam>
  implements IBuilding
{
  declare _id: string;
  declare path: BuildingPath;
  declare position: MapPosition;
  declare health: number;
  declare didSpawn: boolean;

  getTeam() {
    if (greyBuildings.includes(this.path)) {
      return BuildingTeam.Grey;
    } else if (redBuildings.includes(this.path)) {
      return BuildingTeam.Red;
    } else if (purpleBuildings.includes(this.path)) {
      return BuildingTeam.Purple;
    } else {
      throw new Error('Could not find building team');
    }
  }
}
