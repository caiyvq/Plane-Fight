import {
  _decorator,
  AudioClip,
  AudioSource,
  Component,
  director,
  Enum,
  game,
  Node,
} from "cc";
import { GameEvents } from "./gameManager";
const { ccclass, property } = _decorator;

export enum AudioTypes {
  ENEMY_DIE = "enemy die",
  PLAYER_DIE = "player die",
  GET_BOMB = "get bomb",
  USE_BOMB = "use bomb",
  GET_ICE_BULLET = "get ice bullet",
  GAME_OVER = "game over",
  PRESS_BUTTON = "press button",
}

@ccclass("AudioData")
export class AudioData {
  @property({ type: Enum(AudioTypes), displayName: "音频类型" })
  public audioType: AudioTypes;
  @property({ type: AudioClip, displayName: "音频剪辑" })
  public audioClip: AudioClip;
  @property({ type: AudioSource, displayName: "音频源" })
  public audioSource: AudioSource;
}

@ccclass("audioManager")
export class audioManager extends Component {
  //单例模式
  private static _instance: audioManager = null;

  public static instance() {
    if (!this._instance) {
      console.error("audioManager instance is null");
    }
    return this._instance;
  }

  @property({ type: [AudioData], displayName: "音频数据" })
  audioData: AudioData[] = [];

  audioMap: Map<AudioTypes, AudioData> = new Map();

  protected onLoad(): void {
    if (audioManager._instance) {
      this.node.destroy();
      console.warn("audioManager instance already exists, please check the scene.");
      return;
    }
    audioManager._instance = this;
    director.addPersistRootNode(this.node);
    
    game.on(
      GameEvents.AUDIO_PLAY,
      //@ts-ignore
      (audioType: AudioTypes) => {
        this.playAudio(audioType);
      },
      this
    );
  }

  protected onDestroy(): void {
    game.off(
      GameEvents.AUDIO_PLAY,
      //@ts-ignore
      (audioType: AudioTypes) => {
        this.playAudio(audioType);
      },
      this
    );
    // audioManager._instance = null;
  }

  start() {
    this.init();
  }

  update(deltaTime: number) {}

  playAudio(audioType: AudioTypes) {
    console.log("play audio:", audioType);
    this.audioMap.get(audioType)?.audioSource?.play();
  }

  init() {
    for (const audioData of this.audioData) {
      this.audioMap.set(audioData.audioType, audioData);
      if (!audioData.audioSource) {
        audioData.audioSource = this.node.addComponent(AudioSource);
      }
      audioData.audioSource.clip = audioData.audioClip;
      audioData.audioSource.volume=0.1;
      audioData.audioSource.playOnAwake = false;
    }
  }
}
