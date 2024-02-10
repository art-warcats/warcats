import {Inject, Injectable} from '@nestjs/common';
import {InjectConnection, InjectModel} from '@nestjs/mongoose';
import {Model} from 'mongoose';
import {IRedisProvider} from '../redis/warcats.redis';
import {
  IGame,
  BuildingTeam,
  Unit,
  IPlayer,
  Building,
  MapPosition,
  canWalkAt,
  getUnitCost,
  victoryTimeout,
  BuildingPath,
  UnitPath,
  IUnit,
  UnitTeam,
} from 'warcats-common';
import * as mongoose from 'mongoose';
import {Socket} from 'socket.io';
import {IGameMatch} from '../schema/game_match.schema';

export const startingGold = 1000;

const makeBuilding = (path: BuildingPath, pos: number[]) => {
  const position = new MapPosition();
  position.x = pos[0];
  position.y = pos[1];
  return {path, position, health: 10, didSpawn: false};
};

const makeUnit = (path: UnitPath, pos: number[], didMove: boolean) => {
  const position = new MapPosition();
  position.x = pos[0];
  position.y = pos[1];

  return {
    path: path,
    position,
    didMove,
    health: 10,
    fuel: 100,
  } as IUnit;
};

@Injectable()
export class WarCatsGameService {
  constructor(
    @Inject('REDIS')
    private readonly redis: IRedisProvider,
    @InjectModel('Game') private gameModel: Model<IGame>,
    @InjectModel('GameMatch') private gameMatchModel: Model<IGameMatch>,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  async flushdb() {
    await this.redis.pub.flushDb();
  }

  async getReturnFromSession(callback: () => Promise<any>): Promise<any> {
    const session = await this.connection.startSession();
    let ret: {otherSocketId: string; response: any} | number = 0;
    await session.withTransaction(async () => (ret = await callback()));
    await session.endSession();

    if (ret == 0) {
      throw new Error('return cannot be null');
    }
    return ret;
  }

  async addToMatching(socket: Socket, wallet: string, warcatTokenId: number) {
    return this.getReturnFromSession(async () => {
      await this.gameMatchModel.create({
        wallet,
        warcatTokenId,
        searchTime: Date.now(),
      });

      const searches = await this.gameMatchModel.find({}).sort({searchTime: 1});

      console.log('found searches', searches);
      for (const search of searches) {
        if (search.wallet != wallet) {
          console.log('creating game', search.wallet, wallet);
          const game = await this.createGame(
            search.wallet,
            wallet,
            search.warcatTokenId,
            warcatTokenId,
          );
          await this.gameMatchModel.deleteOne({wallet, warcatTokenId});
          await this.gameMatchModel.deleteOne({
            wallet: search.wallet,
            warcatTokenId: search.warcatTokenId,
          });
          return game;
        }
      }

      return null;
    });
  }

  async createGame(
    player1Wallet: string,
    player2Wallet: string,
    player1WarcatTokenId: number,
    player2WarcatTokenId: number,
  ) {
    const buildings = [
      makeBuilding(BuildingPath.GreyB2, [1, 3]),
      makeBuilding(BuildingPath.RedB4, [1, 5]),
      makeBuilding(BuildingPath.GreyB1, [2, 6]),
      makeBuilding(BuildingPath.RedB3, [3, 7]),
      makeBuilding(BuildingPath.GreyB2, [4, 5]),
      makeBuilding(BuildingPath.GreyB2, [5, 8]),
      makeBuilding(BuildingPath.GreyB2, [2, 3]),
      makeBuilding(BuildingPath.GreyB2, [9, 4]),
      makeBuilding(BuildingPath.GreyB2, [12, 8]),
      makeBuilding(BuildingPath.GreyB2, [13, 8]),
      makeBuilding(BuildingPath.PurpleB4, [13, 3]),
      makeBuilding(BuildingPath.GreyB1, [12, 2]),
      makeBuilding(BuildingPath.PurpleB3, [11, 1]),
      makeBuilding(BuildingPath.GreyB2, [13, 5]),
      makeBuilding(BuildingPath.GreyB2, [11, 4]),
      makeBuilding(BuildingPath.GreyB2, [9, 2]),
    ];
    const units = [
      makeUnit(UnitPath.RedInf1, [4, 3], false),
      makeUnit(UnitPath.RedInf1, [5, 7], false),
      makeUnit(UnitPath.RedTank2, [3, 6], false),
      makeUnit(UnitPath.RedWarCat, [3, 5], false),
      makeUnit(UnitPath.PurpleInf1, [9, 2], false),
      makeUnit(UnitPath.PurpleInf1, [10, 5], false),
      makeUnit(UnitPath.PurpleTank2, [11, 2], false),
      makeUnit(UnitPath.PurpleWarCat, [11, 3], false),
    ];

    const player1 = {
      wallet: player1Wallet,
      team: UnitTeam.Red,
      warcatTokenId: player1WarcatTokenId,
      gold: startingGold,
    };
    const player2 = {
      wallet: player2Wallet,
      team: UnitTeam.Purple,
      warcatTokenId: player2WarcatTokenId,
      gold: startingGold,
    };

    try {
      const game = await this.gameModel.create({
        turn: UnitTeam.Red,
        player1,
        player2,
        buildings,
        units,
        gameOver: false,
        lastMoveTime: new Date().getTime(),
      });
      return game;
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  }

  async findActiveGame(wallet: string, warcatTokenId: number | null) {
    return this.getReturnFromSession(async () => {
      const game = await this.gameModel.findOne({
        gameOver: false,
        $or: [
          {'player1.warcatTokenId': warcatTokenId},
          {'player2.warcatTokenId': warcatTokenId},
        ],
      });

      if (game == null) {
        return null;
      }
      if (warcatTokenId != null) {
        if (
          game.player1.warcatTokenId == warcatTokenId &&
          game.player1.wallet != wallet
        ) {
          game.player1.wallet = wallet;
          await game.save();
        }
        if (
          game.player2.warcatTokenId == warcatTokenId &&
          game.player2.wallet != wallet
        ) {
          game.player2.wallet = wallet;
          await game.save();
        }

        if (game.player1.wallet == game.player2.wallet) {
          game.gameOver = true;
          await game.save();
          return null;
        }
      }

      return game;
    });
  }

  async moveUnit(
    wallet: string,
    gameId: string,
    unitId: string,
    position: {x: number; y: number},
  ) {
    return this.getReturnFromSession(async () => {
      const game = await this.gameModel.findById(gameId);

      if (game == null) {
        throw new Error('Could not find game');
      }

      console.log(game.player1.wallet, 'ahha', game.player2.wallet);
      if (!game.isWalletsTurn(wallet)) {
        throw new Error('Not your turn');
      }

      const player = game.getPlayerWithWallet(wallet);
      const unitToMove = game.units.find((unit) => unit._id == unitId);
      console.log(unitToMove);
      if (unitToMove == null || unitToMove.didMove) {
        throw new Error('Unit already moved');
      }
      if (unitToMove.getTeam().toString() != player.team) {
        throw new Error('Trying to move a unit on the other team');
      }

      await this.gameModel.findOneAndUpdate(
        {'units._id': unitId},
        {
          $set: {
            'units.$[t].position': position,
            'units.$[t].didMove': true,
          },
        },
        {arrayFilters: [{'t._id': unitId}]},
      );

      return {
        otherSocketId: game.getOpposingPlayerOfWallet(wallet).wallet,
        response: {unitId, position},
      };
    });
  }

  async declareVictory(wallet: string, gameId: string) {
    return this.getReturnFromSession(async () => {
      const game = await this.gameModel.findById(gameId);

      if (game == null) {
        throw new Error('Could not find game');
      }

      if (game.isWalletsTurn(wallet)) {
        throw new Error('Is your turn');
      }

      const timeSinceMove = new Date().getTime() - game.lastMoveTime;
      const victory = timeSinceMove > victoryTimeout;
      if (victory) {
        const updatedGame = await this.gameModel.updateOne(
          {
            _id: game._id,
          },
          {
            $set: {
              gameOver: true,
            },
          },
        );
        console.log(
          'wrote game over from declare victory',
          game._id,
          updatedGame,
        );
      }

      const winningWallet = victory ? wallet : null;

      return {
        otherSocketId: game.getOpposingPlayerOfWallet(wallet).wallet,
        response: {victory, winningWallet},
      };
    });
  }

  async attackUnit(
    wallet: string,
    gameId: string,
    unitId: string,
    position: {x: number; y: number},
  ) {
    return this.getReturnFromSession(async () => {
      const game = await this.gameModel.findById(gameId);

      if (game == null) {
        throw new Error('Could not find game');
      }

      if (!game.isWalletsTurn(wallet)) {
        throw new Error('Not your turn');
      }

      const player = game.getPlayerWithWallet(wallet);
      const attackingUnit = game.units.find((unit) => unit._id == unitId);
      const attackedUnit = game.units.find((unit) =>
        unit.onMapPosition(position),
      );
      const attackedBuilding = game.buildings.find((unit) =>
        unit.onMapPosition(position),
      );
      if (attackingUnit == null) {
        throw new Error('Unit not found');
      }

      if (attackingUnit.didMove) {
        throw new Error('Unit already attacked');
      }
      if (attackedUnit != null) {
        return await this.doAttackUnit(
          attackingUnit,
          player,
          game,
          attackedUnit,
          unitId,
          wallet,
        );
      } else if (attackedBuilding != null) {
        return await this.doAttackBuilding(
          attackingUnit,
          player,
          game,
          attackedBuilding,
          wallet,
          unitId,
        );
      } else {
        throw new Error('Nothing on the tile to attack');
      }
    });
  }

  private async doAttackUnit(
    attackingUnit: Unit,
    player: IPlayer,
    game: IGame,
    attackedUnit: Unit,
    unitId: string,
    wallet: string,
  ) {
    if (attackingUnit.getTeam().toString() != player.team) {
      throw new Error('Trying to move a unit on the other team');
    }
    if (attackedUnit.getTeam().toString() == player.team) {
      throw new Error('Trying to attack unit on same team');
    }

    console.log(attackingUnit, attackingUnit.getTeam());
    const allowedSpaces = game.getAllowedAttackableSpaces(attackingUnit);
    let found = false;
    for (const allowedSpace of allowedSpaces) {
      if (
        allowedSpace.x == attackedUnit.position.x &&
        allowedSpace.y == attackedUnit.position.y
      ) {
        found = true;
      }
    }

    if (!found) {
      throw new Error('Unit is not allowed to attack other unit');
    }

    const damage = game.calculateDamage(attackingUnit, attackedUnit);
    const newHealth = Math.max(attackedUnit.health - damage, 0);
    const newPosition = game.getAdjacentMovementSpace(
      attackedUnit.position,
      attackingUnit,
    );

    await this.gameModel.findOneAndUpdate(
      {'units._id': attackingUnit._id},
      {
        $set: {
          'units.$[t].didMove': true,
          'units.$[t].position': newPosition,
        },
      },
      {arrayFilters: [{'t._id': attackingUnit._id}]},
    );
    if (newHealth <= 0) {
      await this.gameModel.findOneAndUpdate(
        {'units._id': attackedUnit._id},
        {
          $pull: {
            units: {_id: attackedUnit._id},
          },
        },
        {new: true},
      );
    } else {
      await this.gameModel.findOneAndUpdate(
        {'units._id': attackedUnit._id},
        {
          $set: {
            'units.$[t].health': newHealth,
          },
        },
        {arrayFilters: [{'t._id': attackedUnit._id}]},
      );
    }

    const didWin = attackedUnit.path.endsWith('warcat') && newHealth == 0;
    const winningWallet = didWin ? player.wallet : null;

    if (winningWallet != null) {
      await this.gameModel.findOneAndUpdate(
        {_id: game._id},
        {
          $set: {
            gameOver: true,
          },
        },
      );
    }

    return {
      eventName: 'attacked_unit',
      otherSocketId: game.getOpposingPlayerOfWallet(wallet).wallet,
      response: {
        attackId: unitId,
        attackingPosition: newPosition,
        attackedId: attackedUnit._id.toString(),
        attackedHealth: newHealth,
        winningWallet,
      },
    };
  }

  private async doAttackBuilding(
    attackingUnit: Unit,
    player: IPlayer,
    game: IGame,
    attackedBuilding: Building,
    wallet: string,
    unitId: string,
  ) {
    if (attackingUnit.getTeam().toString() != player.team) {
      throw new Error('Trying to move a unit on the other team');
    }
    if (attackedBuilding.getTeam().toString() == player.team) {
      throw new Error('Trying to attack building on same team');
    }

    const allowedSpaces = game.getAllowedAttackableSpaces(attackingUnit);
    let found = false;
    for (const allowedSpace of allowedSpaces) {
      if (
        allowedSpace.x == attackedBuilding.position.x &&
        allowedSpace.y == attackedBuilding.position.y
      ) {
        found = true;
      }
    }

    if (!found) {
      throw new Error('Unit is not allowed to attack other building');
    }

    console.log(
      'attacked building',
      attackedBuilding.getTeam(),
      attackedBuilding.path,
    );
    if (attackedBuilding.getTeam().toString() == BuildingTeam.Grey) {
      const startingBuildingHealth = 5;
      const newPosition = game.getAdjacentMovementSpace(
        attackedBuilding.position,
        attackingUnit,
      );
      await this.gameModel.findOneAndUpdate(
        {'units._id': attackingUnit._id},
        {
          $set: {
            'units.$[t].didMove': true,
            'units.$[t].position': newPosition,
          },
        },
        {arrayFilters: [{'t._id': attackingUnit._id}]},
      );
      const attackedPath = attackedBuilding.path.replace(
        'grey',
        game.getPlayerWithWallet(wallet).team,
      );
      // await this.gameModel.findOneAndUpdate(
      //   { 'buildings._id': attackedBuilding._id },
      //   {
      //     // $set: {
      //     //   buildings: {
      //     path: attackedPath,
      //     health: startingBuildingHealth,
      //     //   },
      //     // },
      //   },
      //   // { new: true },
      //   { arrayFilters: [{ 't._id': attackedBuilding._id }] },
      // );

      game.buildings = game.buildings.map((building) => {
        if (building._id == attackedBuilding._id) {
          building.path = attackedPath as any;
          building.health = startingBuildingHealth;
        }
        return building;
      });
      await (game as any).save();

      return {
        eventName: 'captured_building',
        otherSocketId: game.getOpposingPlayerOfWallet(wallet).wallet,
        response: {
          attackId: unitId,
          attackingPosition: newPosition,
          attackedBuildingId: attackedBuilding._id.toString(),
          attackedHealth: startingBuildingHealth,
          attackedPath,
        },
      };
    } else {
      const damage = game.calculateBuildingDamage(
        attackingUnit,
        attackedBuilding,
      );
      const newHealth = Math.max(attackedBuilding.health - damage, 0);
      const newPosition = game.getAdjacentMovementSpace(
        attackedBuilding.position,
        attackingUnit,
      );

      await this.gameModel.findOneAndUpdate(
        {'units._id': attackingUnit._id},
        {
          $set: {
            'units.$[t].didMove': true,
            'units.$[t].position': newPosition,
          },
        },
        {arrayFilters: [{'t._id': attackingUnit._id}]},
      );
      if (newHealth <= 0) {
        const newPath = attackedBuilding.path
          .toString()
          .replace('red', 'grey')
          .replace('purple', 'grey');
        console.log('setting new path for building', newPath, attackedBuilding);

        game.buildings = game.buildings.map((building) => {
          if (building._id == attackedBuilding._id) {
            building.path = newPath as any;
          }
          return building;
        });
        await (game as any).save();
        // await this.gameModel.findOneAndUpdate(
        //   { 'buildings._id': attackedBuilding._id },
        //   {
        //     $set: {
        //       path: BuildingPath.GreyB1,
        //     },
        //   },
        //   { arrayFilters: [{ 't._id': attackedBuilding._id }] },
        // );
        return {
          eventName: 'attacked_building',
          otherSocketId: game.getOpposingPlayerOfWallet(wallet).wallet,
          response: {
            attackId: unitId,
            attackingPosition: newPosition,
            attackedId: attackedBuilding._id.toString(),
            attackedHealth: newHealth,
            attackedPath: newPath,
          },
        };
      } else {
        await this.gameModel.findOneAndUpdate(
          {'buildings._id': attackedBuilding._id},
          {
            $set: {
              'buildings.$[t].health': newHealth,
            },
          },
          {arrayFilters: [{'t._id': attackedBuilding._id}]},
        );
        return {
          eventName: 'attacked_building',
          otherSocketId: game.getOpposingPlayerOfWallet(wallet).wallet,
          response: {
            attackId: unitId,
            attackingPosition: newPosition,
            attackedId: attackedBuilding._id.toString(),
            attackedHealth: newHealth,
            attackedPath: attackedBuilding.path,
          },
        };
      }
    }
  }

  async endTurn(wallet: string, gameId: string) {
    return this.getReturnFromSession(async () => {
      const game = await this.gameModel.findById(gameId);

      if (game == null) {
        throw new Error('Could not find game');
      }

      console.log('current turn', game.turn);
      if (!game.isWalletsTurn(wallet)) {
        throw new Error('Not your turn');
      }

      const otherPlayer = game.getOpposingPlayerOfWallet(wallet);
      game.turn = otherPlayer.team;
      game.units = game.units.map((unit) => {
        unit.didMove = false;
        return unit;
      });
      game.buildings = game.buildings.map((building) => {
        building.didSpawn = false;
        return building;
      });
      if (otherPlayer.wallet == game.player1.wallet) {
        game.player2.gold += game.calculateGold(game.player2.team);
      } else {
        game.player1.gold += game.calculateGold(game.player1.team);
      }
      game.lastMoveTime = new Date().getTime();

      await game.save();

      console.log({
        player1Gold: game.player1.gold,
        player2Gold: game.player2.gold,
      });
      return {
        otherSocketId: otherPlayer.wallet,
        response: {
          turn: game.turn,
          player1Gold: game.player1.gold,
          player2Gold: game.player2.gold,
        },
      };
    });
  }

  async spawnUnit(
    wallet: string,
    gameId: string,
    position: MapPosition,
    unitPath: string,
    buildingId: string,
  ) {
    return this.getReturnFromSession(async () => {
      const game = await this.gameModel.findById(gameId);

      if (game == null) {
        throw new Error('Could not find game');
      }

      if (!game.isWalletsTurn(wallet)) {
        throw new Error('Not your turn');
      }

      const building = game.buildings.find(
        (building) => building._id == buildingId,
      );
      if (building == null) {
        throw new Error('Building not found');
      }

      if (building.didSpawn) {
        throw new Error('Building already spawned');
      }

      const player = game.getPlayerWithWallet(wallet);

      if (player.team != building.getTeam()) {
        throw new Error("Not player's building");
      }

      if (!canWalkAt(unitPath as any, position)) {
        throw new Error('Unit cannot walk at spawn space');
      }

      const spawnableSpaces = game.getBuildingSpawnSpaces(building.position);
      let found = false;
      for (const spawnableSpace of spawnableSpaces) {
        if (spawnableSpace.x == position.x && spawnableSpace.y == position.y) {
          found = true;
          break;
        }
      }
      if (!found) {
        throw new Error("Unit can't be spawned here from this building");
      }

      if (wallet == game.player1.wallet) {
        game.player1.gold -= getUnitCost(unitPath as any);
        if (game.player1.gold < 0) {
          throw new Error('Not enough gold');
        }
      } else {
        game.player2.gold -= getUnitCost(unitPath as any);
        if (game.player1.gold < 0) {
          throw new Error('Not enough gold');
        }
      }

      const newUnit = makeUnit(unitPath as any, [position.x, position.y], true);
      game.units.push(newUnit as any);

      game.buildings = game.buildings.map((building) => {
        if (building._id == buildingId) {
          building.didSpawn = true;
        }
        return building;
      });

      await game.save();

      return {
        otherSocketId: game.getOpposingPlayerOfWallet(wallet).wallet,
        response: {
          newUnit: game.units.find(
            (unit) =>
              unit.position.x == newUnit.position.x &&
              unit.position.y == newUnit.position.y,
          ),
          buildingId,
          player1Gold: game.player1.gold,
          player2Gold: game.player2.gold,
        },
      };
    });
  }
}
