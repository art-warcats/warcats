import {Button, StackPanel} from 'babylonjs-gui';
import {MapPosition, SpaceActionType, Unit} from '@warcats/common';
import {tileToWorldPosition} from '../helpers';
import {WarCatGame} from '../WarCatGame';

export class UnitActionPopup extends StackPanel {
  constructor(
    private readonly warCatGame: WarCatGame,
    private readonly mapPosition: MapPosition,
    private readonly unit: Unit,
    private readonly actionType: SpaceActionType,
  ) {
    super();
    this.warCatGame.uiTexture.addControl(this);

    const worldPos = tileToWorldPosition(mapPosition);
    console.log('clicked at', worldPos);

    const button = Button.CreateSimpleButton('but', this.getTopButtonText());
    button.width = '100px';
    button.height = '40px';
    button.color = 'white';
    button.background = 'green';
    this.addControl(button);
    button.onPointerClickObservable.add(() => this.doTopButtonAction());

    const button2 = Button.CreateSimpleButton('but2', 'Cancel');
    button2.width = '100px';
    button2.height = '40px';
    button2.color = 'white';
    button2.background = 'green';
    button2.onPointerClickObservable.add(() => this.doBottomButtonAction());

    this.addControl(button2);
    this.leftInPixels = worldPos.x * 105 + 135;
    this.topInPixels = -worldPos.y * 105 + 40;
  }

  private getTopButtonText() {
    switch (this.actionType) {
      case SpaceActionType.Attackable:
        return 'Attack';
      case SpaceActionType.Available:
        return 'Wait';
      default:
        throw new Error('Invalid space type');
    }
  }

  private doTopButtonAction() {
    console.log('doing top button action');
    switch (this.actionType) {
      case SpaceActionType.Attackable:
        this.warCatGame.attackUnit(this.unit, this.mapPosition);
        break;
      case SpaceActionType.Available:
        this.warCatGame.moveUnit(
          this.unit,
          this.mapPosition,
          this.unit.position,
        );
        break;
    }
  }

  private doBottomButtonAction() {
    console.log('doing top button action');
    this.warCatGame.cancelAction();
  }
}
