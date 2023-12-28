import {Type} from 'class-transformer';
import {gameTiles, MapPosition, PF} from '..';
import {Building} from './Building';
import {PathfindingGrid} from '../grids';
import {Unit} from './Unit';
import {UnitTeam} from '../units';
import {SpaceActionType} from './SpaceActionType';

export const goldPerBuilding = 100;

export interface IPlayer {
  wallet: string;
  team: string;
  warcatTokenId: number;
  gold: number;
}

export interface IGame {
  _id: string;
  turn: string;
  player1: IPlayer;
  player2: IPlayer;
  units: Unit[];
  buildings: Building[];
  gameOver: boolean;
  lastMoveTime: number;
  getPlayerWithWallet: (wallet: string) => IPlayer;
  getOpposingPlayerOfWallet: (wallet: string) => IPlayer;
  isWalletsTurn: (wallet: string) => boolean;
  calculateDamage: (unit1: Unit, unit2: Unit) => number;
  getAllowedAttackableSpaces: (unit: Unit) => MapPosition[];
  getAdjacentMovementSpace: (
    pos: MapPosition,
    unit: Unit,
  ) => MapPosition | null;
  calculateGold: (unitTeam: string) => number;
  calculateBuildingDamage: (unit: Unit, building: Building) => number;
  getBuildingSpawnSpaces: (position: MapPosition) => MapPosition[];
}

export class Game implements IGame {
  declare _id: string;
  declare turn: string;
  declare player1: IPlayer;
  declare player2: IPlayer;
  declare gameOver: boolean;
  declare lastMoveTime: number;

  @Type(() => Unit)
  declare units: Unit[];
  @Type(() => Building)
  declare buildings: Building[];

  getPlayerWithWallet(wallet: string) {
    const player =
      this.player1.wallet == wallet
        ? this.player1
        : this.player2.wallet == wallet
        ? this.player2
        : null;

    if (player == null) {
      throw new Error('This wallet is not a part of this game');
    }

    return player;
  }

  getOpposingPlayerOfWallet(wallet: string) {
    const player =
      this.player1.wallet == wallet
        ? this.player2
        : this.player2.wallet == wallet
        ? this.player1
        : null;

    if (player == null) {
      throw new Error('This wallet is not a part of this game');
    }

    return player;
  }

  isWalletsTurn(wallet: string) {
    const player = this.getPlayerWithWallet(wallet);
    return this.turn == player.team;
  }

  getEntityAtTile(gameTile: MapPosition) {
    const matchingUnitPosition = this.units.find((unit) =>
      unit.onMapPosition(gameTile),
    );
    const matchingBuildingPosition = this.buildings.find((building) =>
      building.onMapPosition(gameTile),
    );

    return matchingUnitPosition != null
      ? matchingUnitPosition
      : matchingBuildingPosition != null
      ? matchingBuildingPosition
      : null;
  }

  unitCanWalkOnSpace(unit: Unit, mapPosition: MapPosition) {
    const entityAtTile = this.getEntityAtTile(mapPosition);
    return entityAtTile == null && unit.canWalkAt(mapPosition);
  }

  getDiamondGrid(mapPosition: MapPosition, radius: number) {
    const mapPositions = [];
    for (let i = mapPosition.x - radius; i <= mapPosition.x + radius; i++) {
      for (let j = mapPosition.y - radius; j <= mapPosition.y + radius; j++) {
        const dx = i - mapPosition.x;
        const dy = j - mapPosition.y;
        const distanceToWalk = Math.abs(dx) + Math.abs(dy);

        const pos: MapPosition = {x: i, y: j};
        if (
          distanceToWalk <= radius &&
          !(mapPosition.x == pos.x && mapPosition.y == pos.y)
        ) {
          if (
            pos.x >= 0 &&
            pos.x < gameTiles.width &&
            pos.y >= 0 &&
            pos.y < gameTiles.height
          ) {
            mapPositions.push(pos);
          }
        }
      }
    }

    return mapPositions;
  }

  getMovementGrid(unit: Unit) {
    return this.getDiamondGrid(unit.position, unit.getMovementRange());
  }

  getAttackGrid(unit: Unit) {
    return this.getDiamondGrid(unit.position, unit.getAttackRange());
  }

  getNearbySpaces(unit: Unit) {
    return this.getMovementGrid(unit).filter((pos) =>
      this.unitCanWalkOnSpace(unit, pos),
    );
  }

  getAdjacentMovementSpace(pos: MapPosition, unit: Unit) {
    const isAdjacent = (pos1: MapPosition, pos2: MapPosition) => {
      return (
        (pos1.x + 1 == pos2.x && pos1.y == pos2.y) ||
        (pos1.x - 1 == pos2.x && pos1.y == pos2.y) ||
        (pos1.x == pos2.x && pos1.y + 1 == pos2.y) ||
        (pos1.x == pos2.x && pos1.y - 1 == pos2.y)
      );
    };
    if (isAdjacent(unit.position, pos)) {
      return unit.position;
    }
    for (const availableSpace of this.getAvailableSpaces(unit)) {
      if (isAdjacent(pos, availableSpace)) {
        return availableSpace;
      }
    }
    return null;
  }

  getAllowedAttackableSpaces(unit: Unit) {
    return this.getAttackGrid(unit).filter((pos) => {
      for (const ourUnit of this.getUnitsOnTeam(unit.getTeam())) {
        if (ourUnit.position.x == pos.x && ourUnit.position.y == pos.y) {
          return false;
        }
      }
      let doesHaveEnemy = false;
      for (const enemy of this.getUnitsOnOtherTeam(unit.getTeam())) {
        if (enemy.position.x == pos.x && enemy.position.y == pos.y) {
          doesHaveEnemy = true;
          break;
        }
      }
      if (!doesHaveEnemy) {
        let doesHaveBuilding = false;

        for (const building of this.getEnemyBuildings(unit)) {
          if (building.position.x == pos.x && building.position.y == pos.y) {
            doesHaveBuilding = true;
          }
        }
        if (!doesHaveBuilding) {
          return false;
        }
      }

      if (this.getAdjacentMovementSpace(pos, unit) == null) {
        return false;
      }

      return true;
    });
  }

  calculateDistance(path: number[][]) {
    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const point1 = path[i];
      const point2 = path[i + 1];

      const difX = Math.abs(point1[0] - point2[0]);
      const difY = Math.abs(point1[1] - point2[1]);
      totalDistance += difX + difY;
    }
    return totalDistance;
  }

  calculateGold(team: string) {
    return (
      this.buildings.filter((building) => building.getTeam() == team).length *
      goldPerBuilding
    );
  }

  setCorrectedGrid(unit: Unit, grid: PathfindingGrid) {
    const nearbySpaces = this.getNearbySpaces(unit);
    for (let i = unit.position.x - 2; i <= unit.position.x + 2; i++) {
      for (let j = unit.position.y - 2; j <= unit.position.y + 2; j++) {
        if (i < 0 || i >= gameTiles.width || j < 0 || j >= gameTiles.height) {
          continue;
        }
        const mapPosition: MapPosition = {x: i, y: j};
        const filter = nearbySpaces.filter(
          (mapPosition2) =>
            mapPosition.x == mapPosition2.x && mapPosition.y == mapPosition2.y,
        );
        if (filter.length == 0) {
          grid.setWalkableAt(mapPosition.x, mapPosition.y, false);
        }
      }
    }
  }

  hasEnoughStamina(unit: Unit, mapPositon: MapPosition) {
    const grid = unit.getPathfindingGrid();
    const finder = new PF.AStarFinder();
    this.setCorrectedGrid(unit, grid);

    const unitMapPosition = unit.position;
    const path: number[][] = finder.findPath(
      unitMapPosition.x,
      unitMapPosition.y,
      mapPositon.x,
      mapPositon.y,
      grid,
    );
    const stamina = 3;

    const distance = this.calculateDistance(path);
    return distance <= stamina && distance != 0;
  }

  getEnemyBuildings(unit: Unit) {
    return this.buildings.filter((building) => {
      return unit.getTeam().toString() != building.getTeam().toString();
    });
  }

  getAvailableSpaces(unit: Unit) {
    return this.getNearbySpaces(unit).filter((mapPosition) =>
      this.hasEnoughStamina(unit, mapPosition),
    );
  }

  getUnitsOnTeam(team: UnitTeam) {
    return this.units.filter((unit) => unit.getTeam() == team);
  }

  getUnitsOnOtherTeam(team: UnitTeam) {
    return this.units.filter((unit) => unit.getTeam() != team);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  calculateDamage(unit1: Unit, _unit2: Unit) {
    return 4;
  }

  getUnitGridSpaces(unit: Unit) {
    const otherBuildings = this.getEnemyBuildings(unit);
    const otherTeam = this.getUnitsOnOtherTeam(unit.getTeam());
    const availableSpaces = this.getAvailableSpaces(unit);
    const nonmovableSpaces = this.getMovementGrid(unit).filter((space) => {
      for (const availableSpace of availableSpaces) {
        if (availableSpace.x == space.x && availableSpace.y == space.y) {
          return false;
        }
      }
      for (const otherUnit of otherTeam) {
        if (
          otherUnit.position.x == space.x &&
          otherUnit.position.y == space.y
        ) {
          return false;
        }
      }
      for (const otherBuilding of otherBuildings) {
        if (
          otherBuilding.position.x == space.x &&
          otherBuilding.position.y == space.y
        ) {
          return false;
        }
      }
      return true;
    });

    const attackSpaces = this.getAllowedAttackableSpaces(unit).filter(
      (space) => {
        for (const availableSpace of availableSpaces) {
          if (availableSpace.x == space.x && availableSpace.y == space.y) {
            return false;
          }
        }
        for (const nonmovableSpace of nonmovableSpaces) {
          if (nonmovableSpace.x == space.x && nonmovableSpace.y == space.y) {
            return false;
          }
        }
        return true;
      },
    );

    const nonattackableSpaces = this.getAttackGrid(unit).filter((space) => {
      for (const availableSpace of availableSpaces) {
        if (availableSpace.x == space.x && availableSpace.y == space.y) {
          return false;
        }
      }
      for (const attackSpace of attackSpaces) {
        if (attackSpace.x == space.x && attackSpace.y == space.y) {
          return false;
        }
      }
      for (const nonmovableSpace of nonmovableSpaces) {
        if (nonmovableSpace.x == space.x && nonmovableSpace.y == space.y) {
          return false;
        }
      }
      return true;
    });

    return {
      availableSpaces,
      nonmovableSpaces,
      attackSpaces,
      nonattackableSpaces,
    };
  }

  getSpaceType(unit: Unit, mapPosition: MapPosition) {
    const {
      availableSpaces,
      nonmovableSpaces,
      attackSpaces,
      nonattackableSpaces,
    } = this.getUnitGridSpaces(unit);

    for (const availableSpace of availableSpaces) {
      if (
        availableSpace.x == mapPosition.x &&
        availableSpace.y == mapPosition.y
      ) {
        return SpaceActionType.Available;
      }
    }
    for (const nonmovableSpace of nonmovableSpaces) {
      if (
        nonmovableSpace.x == mapPosition.x &&
        nonmovableSpace.y == mapPosition.y
      ) {
        return SpaceActionType.Nonmovable;
      }
    }
    for (const nonattackableSpace of nonattackableSpaces) {
      if (
        nonattackableSpace.x == mapPosition.x &&
        nonattackableSpace.y == mapPosition.y
      ) {
        return SpaceActionType.NonAttackable;
      }
    }
    for (const attackSpace of attackSpaces) {
      if (attackSpace.x == mapPosition.x && attackSpace.y == mapPosition.y) {
        return SpaceActionType.Attackable;
      }
    }
    return SpaceActionType.OutOfRange;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  calculateBuildingDamage(unit: Unit, building: Building) {
    return 4;
  }

  getBuildingSpawnSpaces(position: MapPosition) {
    return [
      {x: position.x + 1, y: position.y},
      {x: position.x - 1, y: position.y},
      {x: position.x, y: position.y + 1},
      {x: position.x, y: position.y - 1},
    ].filter((space) => {
      for (const building of this.buildings) {
        if (building.position.x == space.x && building.position.y == space.y) {
          return false;
        }
      }
      for (const unit of this.units) {
        if (unit.position.x == space.x && unit.position.y == space.y) {
          return false;
        }
      }

      return true;
    });
  }
}
