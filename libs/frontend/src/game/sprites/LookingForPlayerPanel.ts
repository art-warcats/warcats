import {StackPanel, TextBlock} from 'babylonjs-gui';
import {WarCatGame} from '../WarCatGame';

export class LookingForPlayerPanel extends StackPanel {
  constructor(private readonly warCatGame: WarCatGame) {
    super();
    this.warCatGame.uiTexture.addControl(this);

    const resultText = new TextBlock('resultText', 'Looking for Player');
    resultText.width = 4;
    resultText.height = 2;
    resultText.fontSize = 32;
    resultText.color = 'black';
    resultText.resizeToFit = true;
    resultText.fontFamily = 'ThaleahFat';
    this.addControl(resultText);

    this.background = 'white';

    this.width = 0.5;
  }
}
