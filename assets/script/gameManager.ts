import {
  _decorator,
  Component,
  director,
  game,
  Label,
  LabelComponent,
  Node,
} from "cc";
import { player } from "./player";
import { enemy } from './enemy';
import { AudioTypes } from "./audioManager";
const { ccclass, property } = _decorator;

export const GameEvents = {
  GET_BOMB: "Get Bomb",
  USE_BOMB: "Use Bomb",
  LIFE_CHANGE: "Life Change",
  SCORE_ADD: "Score Add",
  PLAYER_ENABLE: "Player Enable",
  PLAYER_DISABLE: "Player Disable",
  GAME_OVER: "Game Over",
  ENERGY_ADD: "Energy Add",
  AUDIO_PLAY: "Audio Play",
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
  @property({ type: LabelComponent, displayName: "生命值" })
  lifeLabel: LabelComponent = null;
  @property({ type: LabelComponent, displayName: "分数" })
  scoreLabel: LabelComponent = null;
  @property({ type: LabelComponent, displayName: "本局分数" })
  thisScoreLabel: LabelComponent = null;
  @property({ type: LabelComponent, displayName: "最高分数" })
  bestScoreLabel: LabelComponent = null;
  @property({ type: Node, displayName: "新纪录提示" })
  newRecordHint: Node = null;
  @property({ type: Node, displayName: "暂停按钮" })
  pauseButton: Node = null;
  @property({ type: Node, displayName: "继续按钮" })
  resumeButton: Node = null;
  // @property({ type: Node, displayName: "重来按钮" })
  // restartButton: Node = null;
  // @property({ type: Node, displayName: "退出按钮" })
  // quitButton: Node = null;
  @property({ type: Node, displayName: "游戏结束界面" })
  gameOverUI: Node = null;
  @property({ type: Node, displayName: "物体管理器" })
  objectManager: Node = null;

  bombCount: number = 0; // 炸弹数量
  score: number = 0; // 当前分数

  protected onLoad(): void {
    if (gameManager._instance) {
      this.node.destroy();
      return;
    }
    gameManager._instance = this;

    game.on(GameEvents.GET_BOMB, this.getBomb, this);
    game.on(GameEvents.USE_BOMB, this.useBomb, this);
    game.on(
      GameEvents.LIFE_CHANGE,
      //@ts-ignore
      (currentLifePoint: number) => {
        this.lifeChange(currentLifePoint);
      },
      this
    );
    game.on(
      GameEvents.SCORE_ADD,
      //@ts-ignore
      (score: number) => {
        this.addScore(score);
      },
      this
    );
    game.on(GameEvents.GAME_OVER, this.gameOver, this);
  }

  protected start(): void {}

  protected onDestroy(): void {
    if (gameManager._instance === this) {
      gameManager._instance = null;
    }
    game.off(GameEvents.GET_BOMB, this.getBomb, this);
    game.off(GameEvents.USE_BOMB, this.useBomb, this);
    game.off(
      GameEvents.LIFE_CHANGE,
      (currentLifePoint: number) => {
        this.lifeChange(currentLifePoint);
      },
      this
    );
    game.off(
      GameEvents.SCORE_ADD,
      (score: number) => {
        this.addScore(score);
      },
      this
    );
    game.off(GameEvents.GAME_OVER, this.gameOver, this);
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

  gameOver() {
    game.emit(GameEvents.AUDIO_PLAY,AudioTypes.GAME_OVER);

    this.scheduleOnce(this.pause,1);

    if (this.gameOverUI) {
      this.gameOverUI.active = true;
    }

    if (this.thisScoreLabel) {
      this.thisScoreLabel.string = this.score.toString();
    }

    this.updateBestScore();
  }

  updateBestScore() {
    let bestScore = localStorage.getItem("bestScore");
    if (!bestScore) {
      bestScore = this.score.toString();
    } else {
      if (parseInt(bestScore) < this.score) {
        bestScore = this.score.toString();
        this.newRecordHint.active = true;
      }
    }
    localStorage.setItem("bestScore", bestScore);
    if (this.bestScoreLabel) {
      this.bestScoreLabel.string = bestScore;
    }
  }

  pause(){
    director.pause();
    game.emit(GameEvents.PLAYER_DISABLE);
  }

  resume(){
    director.resume();
    game.emit(GameEvents.PLAYER_ENABLE);
  }

  onPauseButtonClick() {
    this.pause();
    game.emit(GameEvents.AUDIO_PLAY,AudioTypes.PRESS_BUTTON);
    if (this.pauseButton) {
      this.pauseButton.active = false;
    }
    if (this.resumeButton) {
      this.resumeButton.active = true;
    }
  }

  onResumeButtonClick() {
    this.resume();
    game.emit(GameEvents.AUDIO_PLAY,AudioTypes.PRESS_BUTTON);
    if (this.pauseButton) {
      this.pauseButton.active = true;
    }
    if (this.resumeButton) {
      this.resumeButton.active = false;
    }
  }

  onRestartButtonClick() {
    this.onResumeButtonClick();
    director.loadScene(director.getScene().name);
  }

  onQuitButtonClick() {
    this.onResumeButtonClick();
    director.loadScene("start");
  }

  useBomb() {
    // console.log("useBomb");
    if (this.bombCount > 0) {
      game.emit(GameEvents.AUDIO_PLAY,AudioTypes.USE_BOMB);

      this.bombCount--;
      if (this.bombLabel) {
        this.bombLabel.string = this.bombCount.toString();
      }

      this.clearEnemy();
    }
  }

  clearEnemy(){
    // console.log("clear enemy");
    if (!this.objectManager) {
      console.error("objectManager is not set");
      return;
    }
    for(let i = 0; i < this.objectManager.children.length; i++) {
      const childEnemy = this.objectManager.children[i].getComponent(enemy);
      if(childEnemy && childEnemy.currentLifePoint > 0) {
        childEnemy.die();
      }
    }
  }

}
