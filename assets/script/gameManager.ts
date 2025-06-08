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
const { ccclass, property } = _decorator;

export const GameEvents = {
  GET_BOMB: "Get Bomb",
  LIFE_CHANGE: "Life Change",
  SCORE_ADD: "Score Add",
  PLAYER_ENABLE: "Player Enable",
  PLAYER_DISABLE: "Player Disable",
  GAME_OVER: "Game Over",
  ENERGY_ADD: "Energy Add",
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
  
  //TODO:游戏结束后暂停时间会让按钮不显示动画效果
  gameOver() {
    this.onPauseButtonClick();

    if (this.gameOverUI) {
      this.gameOverUI.active = true;
    }

    if (this.thisScoreLabel) {
      this.thisScoreLabel.string = this.score.toString();
    }

    this.updateBestScore();
  }

  //TODO: 新记录提示
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

  onRestartButtonClick() {
    this.onResumeButtonClick();
    this.scheduleOnce(() => {
      director.loadScene(director.getScene().name);
    }, 0.5);
  }

  onQuitButtonClick() {
    director.end();
  }
}
