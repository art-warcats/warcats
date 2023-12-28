import {
  Scene,
  Sprite,
  SpriteManager,
  UniversalCamera,
  Vector3,
} from 'babylonjs';
import {GameSocket} from './sockets/GameSocket';
import {
  BuildingSprite,
  HighlightSprite,
  HighlightSpriteColor,
  UnitSprite,
  WarCatData,
  WarCatSpriteFactory,
} from './sprites';
import {
  GameEntity,
  Game,
  MapPosition,
  mapSize,
  MAP_SPRITE_SIZE,
  PF,
  Unit,
  SpaceActionType,
  Team,
  Building,
  UnitPath,
  BuildingPath,
} from '@warcats/common';
import {screenToWorldPoint, worldPositionToTile} from './helpers';
import {AdvancedDynamicTexture, Button} from 'babylonjs-gui';
import {GAME_HEIGHT, GAME_WIDTH} from '../constants';
import {UnitActionPopup} from './sprites/UnitActionPopup';
import {PlayerNameTag} from './sprites/PlayerNameTag';
import {BuildingPurchasePopup} from './sprites/BuildingPurchasePopup';
import {getWarCatMetadata, WalletInfo} from '../hooks';
import {GameOverPanel} from './sprites/GameOverPanel';
import {OptionsPanel} from './ui/OptionsPanel';
import {DeclareVictoryPanel} from './ui/DeclareVictoryPanel';

export class WarCatGame {
  static createInstance(scene: Scene, warcatTokenId: number) {
    new WarCatGame(scene, warcatTokenId);
  }

  buildings: BuildingSprite[] = [];
  units: UnitSprite[] = [];
  spriteFactory: WarCatSpriteFactory;
  lastClickedEntity: GameEntity<unknown, unknown> | null = null;
  highlightSprites: HighlightSprite[] = [];
  gameSocket: GameSocket;
  game: Game | undefined;
  uiTexture: AdvancedDynamicTexture;
  popupPanel: UnitActionPopup | null = null;
  showingPopup = false;
  player1NameTag: PlayerNameTag | null = null;
  player2NameTag: PlayerNameTag | null = null;
  buildingPurchasePopup: BuildingPurchasePopup | null = null;
  pendingPurchaseInfo: {unitPath: UnitPath; building: Building} | null = null;
  gameOverPanel: GameOverPanel | null = null;
  endTurnButton: Button | null = null;
  optionsButton: Button | null = null;
  optionsPanel: OptionsPanel | null = null;
  declareVictoryPanel: DeclareVictoryPanel | null = null;
  managerMap: SpriteManager | null = null;

  constructor(readonly scene: Scene, readonly warcatTokenId: number) {
    this.init();
    // this.scene.debugLayer.show();

    this.spriteFactory = new WarCatSpriteFactory(this.scene);

    this.initActions();
    this.gameSocket = new GameSocket(this, this.warcatTokenId);
    this.uiTexture = AdvancedDynamicTexture.CreateFullscreenUI('myUI', true);
    this.uiTexture.useSmallestIdeal = true;
    this.uiTexture.idealWidth = GAME_WIDTH;
    this.uiTexture.idealHeight = GAME_HEIGHT;
  }

  private init() {
    const scene = this.scene;
    const camera = new UniversalCamera(
      'UniversalCamera',
      new Vector3(0, 0, -10),
      scene,
    );
    this.initMap();
  }

  private initMap() {
    const scene = this.scene;
    this.managerMap = new SpriteManager(
      'Map',
      '/pngs/map.png',
      1,
      MAP_SPRITE_SIZE,
      scene,
    );
    const map = new Sprite('Map', this.managerMap);
    map.width = mapSize.width;
    map.height = mapSize.height;
  }

  destroy() {
    this.uiTexture.dispose();
    for (const unit of this.units) {
      unit.sprite.dispose();
    }

    for (const building of this.buildings) {
      building.sprite.dispose();
    }

    for (const spriteManager of this.scene.spriteManagers) {
      spriteManager.dispose();
    }
    for (const node of this.scene.getNodes()) {
      node.dispose();
    }
    this.gameSocket.destroy();
  }

  onGameOver(winnerWallet: string) {
    const winningPlayer = this.game!.getPlayerWithWallet(winnerWallet);
    const didWin = winningPlayer.wallet == WalletInfo.getInstance()!.wallet;

    this.gameOverPanel = new GameOverPanel(this, didWin);
  }

  async populateGameData(game: Game) {
    console.error(
      WalletInfo.getInstance()!.wallet,
      game.player1.wallet,
      game.player2.wallet,
    );
    WarCatData.redWarCat = await getWarCatMetadata(game.player1.warcatTokenId);
    WarCatData.purpleWarCat = await getWarCatMetadata(
      game.player2.warcatTokenId,
    );

    console.log('got war cats', WarCatData.redWarCat, WarCatData.purpleWarCat);

    this.player1NameTag = new PlayerNameTag(
      true,
      this,
      game.player1.warcatTokenId,
      game.player1.gold,
      false,
      WalletInfo.getInstance()!.wallet == game.player1.wallet
        ? `#${game.player1.warcatTokenId} (You)`
        : `#${game.player1.warcatTokenId}`,
    );
    this.player2NameTag = new PlayerNameTag(
      false,
      this,
      game.player2.warcatTokenId,
      game.player2.gold,
      true,
      WalletInfo.getInstance()!.wallet == game.player2.wallet
        ? `#${game.player2.warcatTokenId} (You)`
        : `#${game.player2.warcatTokenId}`,
    );

    this.endTurnButton = Button.CreateSimpleButton('EndTurn', 'End Turn');

    this.endTurnButton.widthInPixels = 100;
    this.endTurnButton.heightInPixels = 80;
    this.endTurnButton.leftInPixels = 400;
    this.endTurnButton.topInPixels = 400;
    this.endTurnButton.onPointerClickObservable.add(() => {
      this.gameSocket.endTurn();
    });
    this.endTurnButton.isPointerBlocker = true;
    this.endTurnButton.background = 'white';
    this.endTurnButton.textBlock!.fontFamily = 'ThaleahFat';
    this.uiTexture.addControl(this.endTurnButton);

    this.optionsButton = Button.CreateSimpleButton('Options', 'Options');
    this.optionsButton.widthInPixels = 100;
    this.optionsButton.heightInPixels = 80;
    this.optionsButton.leftInPixels = -400;
    this.optionsButton.topInPixels = 400;
    this.optionsButton.onPointerClickObservable.add(() => {
      if (this.optionsPanel == null) {
        this.optionsPanel = new OptionsPanel(this);
      } else {
        this.optionsPanel.dispose();
        this.optionsPanel = null;
      }
    });
    this.optionsButton.isPointerBlocker = true;
    this.optionsButton.background = 'white';
    this.optionsButton.textBlock!.fontFamily = 'ThaleahFat';
    this.uiTexture.addControl(this.optionsButton);

    for (const unit of game.units) {
      try {
        const sprite = this.spriteFactory.createUnit(unit, this.uiTexture);
        this.units.push(sprite);
      } catch (e: any) {
        console.error(e);
      }
    }
    for (const building of game.buildings) {
      const sprite = this.spriteFactory.createBuilding(
        building,
        this.uiTexture,
      );
      this.buildings.push(sprite);
    }
    this.setTurn(game.turn, false);

    console.log('set game to', game);
    this.game = game;
    this.changeEndTurnButton();
  }

  showDeclareVictory() {
    this.optionsPanel!.dispose();
    this.optionsPanel = null;

    this.declareVictoryPanel = new DeclareVictoryPanel(this);
  }

  hideDeclareVictoryPanel() {
    this.declareVictoryPanel!.dispose();
    this.declareVictoryPanel = null;
  }

  declareVictory() {
    this.declareVictoryPanel!.dispose();
    this.declareVictoryPanel = null;
    this.gameSocket.declareVictory();
  }

  destroyPopup() {
    if (this.popupPanel != null) {
      this.popupPanel.dispose();
    }
    if (this.buildingPurchasePopup != null) {
      this.buildingPurchasePopup.dispose();
    }
  }

  showUnitActionPopup(
    mapPosition: MapPosition,
    unit: Unit,
    actionType: SpaceActionType,
  ) {
    this.destroyPopup();
    this.popupPanel = new UnitActionPopup(this, mapPosition, unit, actionType);
  }

  changeHealth(unitId: string, value: number) {
    const unitSprite = this.units.find(
      (unitSprite) => unitSprite.entity._id == unitId,
    );

    if (unitSprite == null) {
      throw new Error('Unit sprite not found');
    }

    if (value <= 0) {
      unitSprite.destroy();
      this.game!.units = this.game!.units.filter((unit) => unit._id != unitId);
    } else {
      unitSprite.changeHealth(value);
    }
  }

  changeEndTurnButton() {
    if (this.game!.isWalletsTurn(WalletInfo.getInstance()!.wallet)) {
      this.endTurnButton!.background = 'white';
      this.endTurnButton!.isEnabled = true;
    } else {
      this.endTurnButton!.background = 'grey';
      this.endTurnButton!.isEnabled = false;
    }
  }

  setTurn(turn: string, undoGrey = true) {
    if (this.game != null) {
      this.game!.turn = turn;
      this.game.lastMoveTime = new Date().getTime();
      this.changeEndTurnButton();
    }
    if (turn == Team.Purple) {
      this.player1NameTag!.setActive(true);
      this.player2NameTag!.setActive(false);
    } else {
      this.player1NameTag!.setActive(false);
      this.player2NameTag!.setActive(true);
    }
    if (undoGrey) {
      for (const unitSprite of this.units) {
        unitSprite.setIsGreyedOut(false);
      }
      for (const buildingSprite of this.buildings) {
        buildingSprite.setIsGreyedOut(false);
      }
    }
  }

  setPlayer1Gold(player1Gold: number) {
    this.player1NameTag!.setGold(player1Gold);
  }

  setPlayer2Gold(player2Gold: number) {
    this.player2NameTag!.setGold(player2Gold);
  }

  moveUnit(unit: Unit, mapPosition: MapPosition, oldPosition: MapPosition) {
    this.gameSocket.moveUnit(unit._id, mapPosition, oldPosition);
    this.cancelAction();
  }

  attackUnit(unit: Unit, mapPosition: MapPosition) {
    this.gameSocket.attackUnit(unit._id, mapPosition);
    this.cancelAction();
  }

  changeBuildingPath(buildingId: string, buildingPath: BuildingPath) {
    const buildingSprite = this.buildings.find(
      (buildingSprite) => buildingSprite.entity._id == buildingId,
    );
    buildingSprite!.destroy();
    buildingSprite!.entity.path = buildingPath;

    this.buildings = this.buildings.filter(
      (buildingSprite) => buildingSprite.entity._id != buildingId,
    );

    this.buildings.push(
      this.spriteFactory.createBuilding(buildingSprite!.entity, this.uiTexture),
    );
  }

  changeBuildingHealth(buildingId: string, health: number) {
    this.buildings
      .find((buildingSprite) => buildingSprite.entity._id == buildingId)!
      .changeHealth(health);
  }

  startMovement(unitId: string, mapPosition: MapPosition) {
    const unitSprite = this.units.find((sprite) => sprite.entity._id == unitId);
    if (unitSprite == null) {
      throw new Error('Could not find sprite to move');
    }

    unitSprite.setIsGreyedOut(true);
    function calculateDistance(path: number[][]) {
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

    function getNextPoint(
      path: number[][],
      distanceTraveled: number,
      movement: number,
    ) {
      let distanceLeft = distanceTraveled;
      for (let i = 0; i < path.length - 1; i++) {
        const point1 = path[i];
        const point2 = path[i + 1];
        const pathDistance = calculateDistance([point1, point2]);
        if (pathDistance >= distanceLeft) {
          if (point1[0] < point2[0]) {
            // move right
            console.log('move right');
            return {
              x: point1[0] + movement + distanceLeft,
              y: point1[1],
            };
          } else if (point2[0] < point1[0]) {
            //move left
            console.log('move left');
            return {
              x: point1[0] - movement - distanceLeft,
              y: point1[1],
            };
          } else if (point1[1] < point2[1]) {
            // move up
            console.log('move up');
            return {
              x: point1[0],
              y: point1[1] + movement + distanceLeft,
            };
          } else if (point2[1] < point1[1]) {
            // move down
            console.log('move down');
            return {
              x: point1[0],
              y: point1[1] - movement - distanceLeft,
            };
          } else {
            console.log('dunno which way to go');
          }
        } else {
          distanceLeft -= pathDistance;
        }
      }
    }

    const unit = unitSprite.entity as Unit;
    const grid = unit.getPathfindingGrid();
    const finder = new PF.AStarFinder();
    this.game!.setCorrectedGrid(unit, grid);
    const unitMapPosition = unit.position;
    //TODO: fix this type
    const path: number[][] = finder.findPath(
      unitMapPosition.x,
      unitMapPosition.y,
      mapPosition.x,
      mapPosition.y,
      grid,
    );
    const distance = this.game!.calculateDistance(path);

    const speed = 2;
    const totalTime = (distance / speed) * 1000;
    const startTime = new Date().getTime();
    const interval = 100;

    async function doMovement() {
      setTimeout(() => {
        if (unitSprite == null) {
          throw new Error('Could not find sprite to move');
        }
        const now = new Date().getTime();
        const percentFinished = (now - startTime) / totalTime;
        const distanceTraveled = percentFinished * distance;

        const movement = (interval / 1000) * speed;

        const nextPoint = getNextPoint(path, distanceTraveled, movement);

        if (percentFinished > 1 || nextPoint === undefined) {
          unitSprite.moveTo(mapPosition, false);
        } else {
          unitSprite.moveTo(nextPoint, true);
          doMovement();
        }
      }, interval);
    }

    doMovement();
  }

  private highlightUnitPath(unit: Unit) {
    this.removeHighlight();

    const {
      availableSpaces,
      nonmovableSpaces,
      attackSpaces,
      nonattackableSpaces,
    } = this.game!.getUnitGridSpaces(unit);

    this.addHighlightSpaces(availableSpaces, HighlightSpriteColor.White);
    this.addHighlightSpaces(nonmovableSpaces, HighlightSpriteColor.Grey);
    this.addHighlightSpaces(attackSpaces, HighlightSpriteColor.Red);
    this.addHighlightSpaces(nonattackableSpaces, HighlightSpriteColor.DarkRed);
  }

  private addHighlightSpaces(
    spaces: MapPosition[],
    color: HighlightSpriteColor,
  ) {
    for (const availableSpace of spaces) {
      this.highlightSprites.push(
        new HighlightSprite(availableSpace, color, this.scene),
      );
    }
  }

  private removeHighlight() {
    for (const highlight of this.highlightSprites) {
      highlight.dispose();
    }
    this.highlightSprites = [];
  }

  cancelAction() {
    this.destroyPopup();
    this.showingPopup = false;
    this.removeHighlight();
    this.lastClickedEntity = null;
  }

  showBuildingPurchasePopup(building: Building) {
    this.buildingPurchasePopup = new BuildingPurchasePopup(this, building);
  }

  setPendingPurchase(unitPath: UnitPath, building: Building) {
    this.showingPopup = false;
    this.destroyPopup();
    this.pendingPurchaseInfo = {unitPath, building};
    this.addHighlightSpaces(
      this.game!.getBuildingSpawnSpaces(building.position),
      HighlightSpriteColor.White,
    );
  }

  private didClickPendingPurchaseArea(mapPosition: MapPosition) {
    for (const position of this.game!.getBuildingSpawnSpaces(
      this.pendingPurchaseInfo!.building.position,
    )) {
      if (position.x == mapPosition.x && position.y && mapPosition.y) {
        return true;
      }
    }
    return false;
  }

  private purchaseUnit(mapPosition: MapPosition) {
    this.gameSocket.spawnUnit(
      this.pendingPurchaseInfo!.unitPath,
      this.pendingPurchaseInfo!.building,
      mapPosition,
    );
  }

  spawnUnit(unit: Unit) {
    const sprite = this.spriteFactory.createUnit(unit, this.uiTexture);
    this.units.push(sprite);
  }

  setBuildingInactive(buildingId: string) {
    this.buildings
      .find((building) => building.entity._id == buildingId)
      ?.setIsGreyedOut(true);
  }

  private entityBelongsToActivePlayer(entity: GameEntity<unknown, unknown>) {
    const playerTeam =
      this.game!.player1.wallet == WalletInfo.getInstance()!.wallet
        ? this.game!.player1.team
        : this.game!.player2.team;
    console.error(playerTeam, entity.getTeam());
    return playerTeam == entity.getTeam();
  }

  private initActions() {
    const scene = this.scene;

    this.scene.onPointerDown = (evt, pickInfo) => {
      console.error('game data', this.game!);

      const worldPoint = screenToWorldPoint(scene, evt);
      const gameTile = worldPositionToTile(worldPoint);

      const entity = this.game!.getEntityAtTile(gameTile);
      if (this.pendingPurchaseInfo != null) {
        if (this.didClickPendingPurchaseArea(gameTile)) {
          this.purchaseUnit(gameTile);
        }
        this.pendingPurchaseInfo = null;
        this.removeHighlight();
      } else if (this.showingPopup == true) {
        this.cancelAction();
      } else if (entity instanceof Unit && this.lastClickedEntity == null) {
        this.highlightUnitPath(entity);
        this.lastClickedEntity = entity;
      } else if (
        entity instanceof Building &&
        this.lastClickedEntity == null &&
        this.entityBelongsToActivePlayer(entity)
      ) {
        this.showBuildingPurchasePopup(entity);
        this.showingPopup = true;
      } else {
        if (this.lastClickedEntity instanceof Unit) {
          if (
            !this.entityBelongsToActivePlayer(this.lastClickedEntity) ||
            !this.game!.isWalletsTurn(WalletInfo.getInstance()!.wallet)
          ) {
            this.removeHighlight();
            this.lastClickedEntity = null;
          } else {
            const actionType = this.game!.getSpaceType(
              this.lastClickedEntity,
              gameTile,
            );
            switch (actionType) {
              case SpaceActionType.Available:
                this.showUnitActionPopup(
                  gameTile,
                  this.lastClickedEntity,
                  actionType,
                );
                this.showingPopup = true;
                break;
              case SpaceActionType.Attackable:
                this.showUnitActionPopup(
                  gameTile,
                  this.lastClickedEntity,
                  actionType,
                );
                this.showingPopup = true;
                break;
              default:
                this.cancelAction();
                break;
            }
          }
        }
      }
    };
  }
}
