import {
  UnitPath,
  UnitTeam,
  redUnits,
  purpleUnits,
  landUnits,
  airUnits,
} from '../units';
import {getGrid, MobilityType} from '../grids';
import {GameEntity} from '../abstracts';
import {MapPosition} from '..';

export interface IUnit {
  _id: string;
  path: UnitPath;
  position: MapPosition;
  didMove: boolean;
  fuel: number;
  health: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getUnitCost = (unitPath: UnitPath) => {
  return 200;
};

const getMobilityType = (unitPath: UnitPath) => {
  if (landUnits.includes(unitPath)) {
    return MobilityType.Land;
  } else if (airUnits.includes(unitPath)) {
    return MobilityType.Air;
  } else {
    throw new Error('Mobility type not found');
  }
};

export const canWalkAt = (unitPath: UnitPath, mapPosition: MapPosition) => {
  return getPathfindingGrid(getMobilityType(unitPath)).isWalkableAt(
    mapPosition.x,
    mapPosition.y,
  );
};

const getPathfindingGrid = (mobilityType: MobilityType) => {
  return getGrid(mobilityType);
};

export class Unit extends GameEntity<UnitPath, UnitTeam> implements IUnit {
  declare _id: string;
  declare path: UnitPath;
  declare position: MapPosition;
  declare didMove: boolean;
  declare fuel: number;
  declare health: number;

  getTeam() {
    if (redUnits.includes(this.path)) {
      return UnitTeam.Red;
    } else if (purpleUnits.includes(this.path)) {
      return UnitTeam.Purple;
    } else {
      throw new Error('Team type not found');
    }
  }

  getMobilityType() {
    return getMobilityType(this.path);
  }

  canWalkAt(mapPosition: MapPosition) {
    return this.getPathfindingGrid().isWalkableAt(mapPosition.x, mapPosition.y);
  }

  getPathfindingGrid() {
    return getPathfindingGrid(this.getMobilityType());
  }

  getMovementRange() {
    return 2;
  }

  getAttackRange() {
    return 3;
  }
}
