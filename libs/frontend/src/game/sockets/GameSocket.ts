import {throwErr} from '../../utils';
import {io, Socket} from 'socket.io-client';
import {
  Game,
  MapPosition,
  Unit,
  Building,
  UnitPath,
  Team,
  BuildingTeam,
} from '@warcats/common';
import {WarCatGame} from '../WarCatGame';
import {plainToInstance} from 'class-transformer';
import {WalletInfo} from '@warcats/frontend';

const api =
  process.env.NEXT_PUBLIC_API ?? throwErr('NEXT_PUBLIC_API not defined');

export class GameSocket {
  game: WarCatGame;
  socket: Socket;
  gameData: Game | null = null;

  constructor(game: WarCatGame, warcatTokenId: number) {
    this.game = game;
    this.socket = io(api);
    this.socket.on('found_game', async (serializedGame: Game) => {
      try {
        console.log('Game Data', serializedGame);
        const game = plainToInstance(Game, serializedGame, {
          //enableImplicitConversion: true
          // excludeExtraneousValues: true
        });
        game.units = plainToInstance(Unit, game.units);
        game.buildings = plainToInstance(Building, game.buildings);

        console.log('found_game', game);
        this.gameData = game;
        await this.game.populateGameData(game);
      } catch (e) {
        console.error(e);
      }
    });

    this.socket.emit('find_game', {
      warcatTokenId,
      wallet: WalletInfo.getInstance()!.wallet,
      account: WalletInfo.getInstance()!.account,
      signed: WalletInfo.getInstance()!.signed,
      signature: WalletInfo.getInstance()!.signature,
    });
    this.socket.on('moved_unit', ({unitId, position}: any) => {
      console.log('received movement unit', unitId, position);
      this.game.startMovement(unitId, position);
    });
    this.socket.on(
      'attacked_unit',
      ({
        attackId,
        attackedId,
        attackedHealth,
        attackingPosition,
        winningWallet,
      }: any) => {
        console.log('received attack unit', {
          attackId,
          attackedId,
          attackedHealth,
          attackingPosition,
          winningWallet,
        });
        this.game.changeHealth(attackedId, attackedHealth);
        this.game.startMovement(attackId, attackingPosition);
        if (winningWallet != null) {
          this.game.onGameOver(winningWallet);
        }
      },
    );
    this.socket.on('declare_victory', ({winningWallet}: any) => {
      console.log('received victory', {
        winningWallet,
      });
      if (winningWallet != null) {
        this.game.onGameOver(winningWallet);
      }
    });
    this.socket.on('ended_turn', ({turn, player1Gold, player2Gold}: any) => {
      this.game.setTurn(turn);
      console.log({player1Gold, player2Gold});
      this.game.setPlayer1Gold(player1Gold);
      this.game.setPlayer2Gold(player2Gold);
    });

    this.socket.on(
      'spawned_unit',
      ({newUnit, buildingId, player1Gold, player2Gold}: any) => {
        newUnit = plainToInstance(Unit, newUnit);
        this.game.spawnUnit(newUnit);
        this.game.game?.units.push(newUnit);
        this.game.setBuildingInactive(buildingId);
        this.game.setPlayer1Gold(player1Gold);
        this.game.setPlayer2Gold(player2Gold);
      },
    );

    this.socket.on(
      'captured_building',
      ({
        attackId,
        attackingPosition,
        attackedBuildingId,
        attackedHealth,
        attackedPath,
      }: any) => {
        console.log('received capture building', {
          attackId,
          attackingPosition,
          attackedBuildingId,
          attackedHealth,
          attackedPath,
        });
        this.game.startMovement(attackId, attackingPosition);
        this.game.changeBuildingPath(attackedBuildingId, attackedPath);
        this.game.changeBuildingHealth(attackedBuildingId, attackedHealth);
      },
    );

    this.socket.on(
      'attacked_building',
      ({
        attackId,
        attackingPosition,
        attackedId,
        attackedHealth,
        attackedPath,
      }: any) => {
        console.log('received attacked building', {
          attackId,
          attackingPosition,
          attackedId,
          attackedHealth,
          attackedPath,
        });
        this.game.startMovement(attackId, attackingPosition);
        this.game.changeBuildingPath(attackedId, attackedPath);
        this.game.changeBuildingHealth(attackedId, attackedHealth);
      },
    );
  }

  declareVictory() {
    this.socket.emit('declare_victory', {
      gameId: this.gameData!._id,
      wallet: WalletInfo.getInstance()!.wallet,
      account: WalletInfo.getInstance()!.account,
      signed: WalletInfo.getInstance()!.signed,
      signature: WalletInfo.getInstance()!.signature,
    });
  }

  moveUnit(unitId: string, position: MapPosition, oldPosition: MapPosition) {
    console.log('moving unit', unitId, position);
    this.socket.emit('move_unit', {
      gameId: this.gameData!._id,
      unitId,
      position,
      oldPosition,
      wallet: WalletInfo.getInstance()!.wallet,
      account: WalletInfo.getInstance()!.account,
      signed: WalletInfo.getInstance()!.signed,
      signature: WalletInfo.getInstance()!.signature,
    });
  }

  attackUnit(unitId: string, position: MapPosition) {
    this.socket.emit('attack_unit', {
      gameId: this.gameData!._id,
      unitId,
      position,
      wallet: WalletInfo.getInstance()!.wallet,
      account: WalletInfo.getInstance()!.account,
      signed: WalletInfo.getInstance()!.signed,
      signature: WalletInfo.getInstance()!.signature,
    });
  }

  endTurn() {
    this.socket.emit('end_turn', {
      gameId: this.gameData!._id,
      wallet: WalletInfo.getInstance()!.wallet,
      account: WalletInfo.getInstance()!.account,
      signed: WalletInfo.getInstance()!.signed,
      signature: WalletInfo.getInstance()!.signature,
    });
  }

  spawnUnit(unitPath: UnitPath, building: Building, mapPosition: MapPosition) {
    this.socket.emit('purchase_unit', {
      gameId: this.gameData!._id,
      buildingId: building._id,
      position: mapPosition,
      unitPath: unitPath.toString(),
      wallet: WalletInfo.getInstance()!.wallet,
      account: WalletInfo.getInstance()!.account,
      signed: WalletInfo.getInstance()!.signed,
      signature: WalletInfo.getInstance()!.signature,
    });
  }

  destroy() {
    this.socket.disconnect();
  }
}
