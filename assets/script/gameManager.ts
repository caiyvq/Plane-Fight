import { _decorator, Component, game, Label, LabelComponent, Node } from "cc";
import { player } from "./player";
const { ccclass, property } = _decorator;

@ccclass("gameManager")
export class gameManager extends Component {
  //单例模式
  private static _instance: gameManager = null;

  public static instance() {
    if (!this._instance) {
      console.error(
        "gameManager instance is null, please check if gameManager is added to the scene."
      );
    }
    return this._instance;
  }

  @property({ type: LabelComponent, displayName: "炸弹数量" })
  bombLabel: LabelComponent = null;

  bombCount: number = 0;

  protected onLoad(): void {
    if (gameManager._instance) {
      this.node.destroy();
      return;
    }
    gameManager._instance = this;
  }

  protected start(): void {
    // console.log("listening for Get Bomb event");
    game.on('Get Bomb', this.getBomb, this);
  }

  protected onDestroy(): void {
    if (gameManager._instance === this) {
      gameManager._instance = null;
    }
    game.off('Get Bomb', this.getBomb, this);
  }

  getBomb() {
    // console.log("getBomb");
    this.bombCount++;
    if (this.bombLabel) {
    //   console.log("bombCount: " + this.bombCount);
      this.bombLabel.string = this.bombCount.toString();
    }
  }
}
