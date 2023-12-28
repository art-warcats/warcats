import {Color4, Scene, Vector3} from 'babylonjs';
import {GameSprite} from '../abstracts';
import {MapPosition, Unit} from '@warcats/common';
import {AdvancedDynamicTexture, TextBlock} from 'babylonjs-gui';

export class UnitSprite extends GameSprite<Unit> {
  hpText: TextBlock;

  constructor(unit: Unit, scene: Scene, uiTexture: AdvancedDynamicTexture) {
    super(unit, scene);
    this.hpText = new TextBlock('hpText', '');
    this.hpText.width = 0.1;
    this.hpText.height = 0.1;
    this.hpText.fontSize = 32;
    this.hpText.color = 'white';
    this.hpText.fontFamily = 'ThaleahFat';

    uiTexture.addControl(this.hpText);
    this.repositionHpText();

    if (unit.path.startsWith('purple')) {
      this.sprite.invertU = true;
    }

    if (unit.didMove) {
      this.setIsGreyedOut(true);
    }

    this.changeHealth(unit.health);
    if (unit.path.endsWith('warcat')) {
      this.sprite.playAnimation(0, 7, true, 100);
    }

    this.sprite.position = this.sprite.position.addInPlace(
      new Vector3(0, 0, -0.01),
    );

    if (unit.path.endsWith('warcat')) {
      this.sprite.width = 1;
      this.sprite.height = 1;
    }
  }

  setIsGreyedOut(isGreyedOut: boolean) {
    if (isGreyedOut) {
      this.sprite.color = new Color4(0.25, 0.25, 0.25, 1);
    } else {
      this.sprite.color = new Color4(1, 1, 1, 1);
    }
  }

  private repositionHpText() {
    if (this.hpText != null) {
      const unitPos = this.sprite.position;

      this.hpText.left = unitPos.x * 110 + 20;
      this.hpText.top = unitPos.y * -110 + 60;
    }
  }

  changeHealth(hp: number) {
    this.entity.health = hp;
    this.hpText.text = `${hp}`;
    if (hp == 10) {
      this.hpText.isVisible = false;
    } else {
      this.hpText.isVisible = true;
    }
  }

  moveTo(mapPosition: MapPosition, reorient = false) {
    super.moveTo(mapPosition, reorient);
    this.repositionHpText();
  }

  destroy() {
    super.destroy();
    this.hpText.dispose();
  }
}
