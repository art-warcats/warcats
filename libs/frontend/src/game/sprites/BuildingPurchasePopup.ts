import {WalletInfo} from '@warcats/frontend';
import {Button, ScrollViewer, StackPanel} from 'babylonjs-gui';
import {
  airUnits,
  Building,
  getUnitCost,
  landUnits,
  MapPosition,
  UnitPath,
} from '@warcats/common';
import {tileToWorldPosition} from '../helpers';
import {WarCatGame} from '../WarCatGame';

const getUnitName = (unitPath: UnitPath) => {
  switch (unitPath) {
    case UnitPath.PurpleAA:
      return 'Purple Rocket';
    case UnitPath.PurpleHeli1:
      return 'Purple Chinook';
    case UnitPath.PurpleHeli2:
      return 'Purple Apache';
    case UnitPath.PurpleInf1:
      return 'Purple Infantry';
    case UnitPath.PurpleInf2:
      return 'Purple Anti Armor';
    case UnitPath.PurpleJet1:
      return 'Purple Jet';
    case UnitPath.PurpleJet2:
      return 'Purple Bomber';
    case UnitPath.PurpleTank1:
      return 'Purple Tank';
    case UnitPath.PurpleTank2:
      return 'Purple Anti Air';
    case UnitPath.PurpleTank3:
      return 'Purple Recon';
    case UnitPath.RedAA:
      return 'Red Rocket';
    case UnitPath.RedHeli1:
      return 'Red Chinook';
    case UnitPath.RedHeli2:
      return 'Red Apache';
    case UnitPath.RedInf1:
      return 'Red Infantry';
    case UnitPath.RedInf2:
      return 'Red Anti Armor';
    case UnitPath.RedJet1:
      return 'Red Jet';
    case UnitPath.RedJet2:
      return 'Red Bomber';
    case UnitPath.RedTank1:
      return 'Red Tank';
    case UnitPath.RedTank2:
      return 'Red Anti Air';
    case UnitPath.RedTank3:
      return 'Red Recon';
    default:
      return 'Unknown';
  }
};

export class BuildingPurchasePopup extends StackPanel {
  constructor(
    private readonly warCatGame: WarCatGame,
    private readonly building: Building,
  ) {
    super();
    this.warCatGame.uiTexture.addControl(this);

    const worldPos = tileToWorldPosition(building.position);
    console.log('clicked at', worldPos);

    const myScrollViewer = new ScrollViewer();
    myScrollViewer.width = '100px';
    myScrollViewer.height = '100px';
    myScrollViewer.horizontalBar.dispose();
    const innerStack = new StackPanel('inner stack');
    let top = 0;
    console.log('spawnable', this.getPurchaseInfos(building));
    for (const unitPurchaseInfo of this.getPurchaseInfos(building)) {
      const button = Button.CreateSimpleButton(
        'buy' + unitPurchaseInfo.unitPath.toString(),
        unitPurchaseInfo.name,
      );
      button.width = '100px';
      button.height = '40px';
      button.color = 'white';
      button.background = 'green';
      button.onPointerClickObservable.add(() =>
        this.setPendingPurchase(unitPurchaseInfo.unitPath),
      );
      button.top = top + 'px';
      top += 40;
      innerStack.addControl(button);
    }
    myScrollViewer.addControl(innerStack);

    const button2 = Button.CreateSimpleButton('but2', 'Cancel');
    button2.width = '100px';
    button2.height = '40px';
    button2.color = 'white';
    button2.background = 'green';
    button2.onPointerClickObservable.add(() => this.doBottomButtonAction());

    this.addControl(myScrollViewer);
    this.addControl(button2);
    this.leftInPixels = worldPos.x * 105 + 135;
    this.topInPixels = -worldPos.y * 105 + 40;
  }

  private getPurchaseInfos(building: Building) {
    return this.getSpawnableUnits(building).map((unitPath) => {
      return {
        unitPath,
        cost: getUnitCost(unitPath),
        name: getUnitName(unitPath),
      };
    });
  }

  private getSpawnableUnits = (building: Building) => {
    const player = this.warCatGame.game!.getPlayerWithWallet(
      WalletInfo.getInstance()!.wallet,
    );
    if (building.path.endsWith('b4')) {
      return landUnits.filter((unitPath) => {
        return unitPath.startsWith(player.team) && !unitPath.endsWith('warcat');
      });
    } else if (building.path.endsWith('b3')) {
      return airUnits.filter((unitPath) => {
        return unitPath.startsWith(player.team) && !unitPath.endsWith('warcat');
      });
    } else {
      return [];
    }
  };

  private setPendingPurchase(unitPath: UnitPath) {
    console.log('doing top button action');
    this.warCatGame.setPendingPurchase(unitPath, this.building);
  }

  private doBottomButtonAction() {
    console.log('doing top button action');
    this.warCatGame.destroyPopup();
  }
}
