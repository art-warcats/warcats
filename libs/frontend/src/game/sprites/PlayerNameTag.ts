import { Image, Rectangle, TextBlock } from 'babylonjs-gui';
import { WarCatGame } from '../WarCatGame';

export class PlayerNameTag extends Rectangle {
  goldText: TextBlock;
  warcatImage: Image;

  constructor(
    active: boolean,
    private readonly warCatGame: WarCatGame,
    warcatTokenId: number,
    gold: number,
    flipped: boolean,
    nameTextStr: string
  ) {
    super();
    this.warCatGame.uiTexture.addControl(this);

    this.color = flipped ? 'purple' : 'red';
    this.topInPixels = -400;
    this.leftInPixels = flipped ? 400 : -400;
    this.widthInPixels = 260;
    this.heightInPixels = 100;
    this.setActive(active);

    const nameText = new TextBlock('nameText', nameTextStr);
    nameText.width = 4;
    nameText.height = 2;
    nameText.fontSize = 32;
    nameText.top = -20;
    nameText.left = flipped ? -50 : 50;
    nameText.color = 'black';
    nameText.fontFamily = 'ThaleahFat';
    this.addControl(nameText);

    this.goldText = new TextBlock('goldText', '' + gold);
    this.goldText.width = 4;
    this.goldText.height = 2;
    this.goldText.fontSize = 32;
    this.goldText.top = 20;
    this.goldText.left = flipped ? -50 : 50;
    this.goldText.color = 'black';
    this.goldText.fontFamily = 'ThaleahFat';

    this.addControl(this.goldText);

    this.warcatImage = new Image(
      'warcat',
      `assets/images/${warcatTokenId}.png`
    );
    const warcatLeft = 75;
    this.warcatImage.leftInPixels = flipped ? warcatLeft : -warcatLeft;
    this.warcatImage.topInPixels = 0;
    this.warcatImage.widthInPixels = 75;
    this.warcatImage.heightInPixels = 75;
    if (flipped) {
      this.warcatImage.clipContent = false;
      this.warcatImage.scaleX = -1;
    }
    // this.warcatImage.

    this.addControl(this.warcatImage);
  }

  setGold(gold: number) {
    this.goldText.text = '' + gold;
  }

  setActive(active: boolean) {
    if (active) {
      this.background = 'grey';
    } else {
      this.background = 'white';
    }
  }
}
