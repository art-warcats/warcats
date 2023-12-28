import { Button, StackPanel, TextBlock } from 'babylonjs-gui';
import { WarCatTitleUi } from '../ui/WarCatTitleUi';
import { WarCatGame } from '../WarCatGame';

export class GameOverPanel extends StackPanel {
  constructor(private readonly warCatGame: WarCatGame, playerWon: boolean) {
    super();
    this.warCatGame.uiTexture.addControl(this);

    const text = playerWon ? 'Victory!' : 'Defeat!';

    const resultText = new TextBlock('resultText', text);
    resultText.width = 4;
    resultText.height = 2;
    resultText.fontSize = 32;
    resultText.color = 'black';
    resultText.resizeToFit = true;
    resultText.fontFamily = 'ThaleahFat';
    this.addControl(resultText);

    const button2 = Button.CreateSimpleButton('resultButton', 'Main Menu');
    button2.width = '100px';
    button2.height = '40px';
    button2.color = 'white';
    button2.background = 'blue';
    this.addControl(button2);
    button2.onPointerClickObservable.add(() => this.doTopButtonAction2());
    button2.textBlock!.fontFamily = 'ThaleahFat';
    this.background = 'white';

    this.width = 0.1;
  }

  private doTopButtonAction2() {
    this.warCatGame.destroy();
    WarCatTitleUi.createInstance(this.warCatGame.scene);
  }
}
