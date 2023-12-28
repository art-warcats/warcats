import {Color4, Scene} from 'babylonjs';
import {GameSprite} from '../abstracts';
import {Building} from '@warcats/common';
import {AdvancedDynamicTexture, TextBlock} from 'babylonjs-gui';

export class BuildingSprite extends GameSprite<Building> {
  hpText: TextBlock;

  constructor(
    building: Building,
    scene: Scene,
    uiTexture: AdvancedDynamicTexture,
  ) {
    super(building, scene);

    this.hpText = new TextBlock('hpText', '');
    this.hpText.width = 0.1;
    this.hpText.height = 0.1;
    this.hpText.fontSize = 32;
    this.hpText.color = 'white';
    this.hpText.fontFamily = 'ThaleahFat';

    uiTexture.addControl(this.hpText);
    this.repositionHpText();
    this.changeHealth(building.health);
  }

  private repositionHpText() {
    if (this.hpText != null) {
      const unitPos = this.sprite.position;

      this.hpText.left = unitPos.x * 110 + 20;
      this.hpText.top = unitPos.y * -110 + 60;
    }
  }

  setIsGreyedOut(isGreyedOut: boolean) {
    if (isGreyedOut) {
      this.sprite.color = new Color4(0.25, 0.25, 0.25, 1);
    } else {
      this.sprite.color = new Color4(1, 1, 1, 1);
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
    if (this.entity.path.toString().includes('grey')) {
      this.hpText.isVisible = false;
    }
  }

  destroy() {
    super.destroy();
    this.hpText.dispose();
  }
}
