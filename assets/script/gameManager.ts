import { _decorator, Component, director, game, Label, LabelComponent, Node } from "cc";
import { player } from "./player";
const { ccclass, property } = _decorator;

export const GameEvents = {
    GET_BOMB: 'Get Bomb',
    LIFE_CHANGE: 'Life Change',
    SCORE_ADD: 'Score Add',
    PLAYER_ENABLE: 'Player Enable',
    PLAYER_DISABLE: 'Player Disable',
} as const;

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
  @property({type:LabelComponent,displayName:'生命值'})
  lifeLabel: LabelComponent = null;
  @property({type:LabelComponent,displayName:'分数'})
  scoreLabel: LabelComponent = null;
  @property({ type: Node, displayName: "暂停按钮" })
  pauseButton: Node = null;
  @property({ type: Node, displayName: "继续按钮" })
  resumeButton: Node = null;

  bombCount: number = 0;
  score: number = 0;

  protected onLoad(): void {
    if (gameManager._instance) {
      this.node.destroy();
      return;
    }
    gameManager._instance = this;
    // console.log("listening for Get Bomb event");
    game.on(GameEvents.GET_BOMB, this.getBomb, this);
    //@ts-ignore
    game.on(GameEvents.LIFE_CHANGE, (currentLifePoint: number)=> { this.lifeChange(currentLifePoint); }, this);
    //@ts-ignore
    game.on(GameEvents.SCORE_ADD, (score: number) => { this.addScore(score); }, this);
  }

  protected start(): void {
  }

  protected onDestroy(): void {
    if (gameManager._instance === this) {
      gameManager._instance = null;
    }
    game.off(GameEvents.GET_BOMB, this.getBomb, this);
    game.off(GameEvents.LIFE_CHANGE, this.lifeChange, this);
  }

  getBomb() {
    // console.log("getBomb");
    this.bombCount++;
    if (this.bombLabel) {
    //   console.log("bombCount: " + this.bombCount);
      this.bombLabel.string = this.bombCount.toString();
    }
  }

  lifeChange(currentLifePoint: number) {
    // console.log("lifeChange");
    if (this.lifeLabel) {
      this.lifeLabel.string = currentLifePoint.toString();
    }
  }

  addScore(score: number) {
    // console.log("addScore");
    this.score += score;
    if (this.scoreLabel) {
      this.scoreLabel.string = this.score.toString();
    }

  }

  onPauseButtonClick() {
    director.pause();
    game.emit(GameEvents.PLAYER_DISABLE);
    if (this.pauseButton) {
      this.pauseButton.active = false;
    }
    if (this.resumeButton) {
      this.resumeButton.active = true;
    }
  }

  onResumeButtonClick() {
    director.resume();
    game.emit(GameEvents.PLAYER_ENABLE);
    if (this.pauseButton) {
      this.pauseButton.active = true;
    }
    if (this.resumeButton) {
      this.resumeButton.active = false;
    }
  }
}
