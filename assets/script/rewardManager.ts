import { _decorator, Component, Enum, math, Node, Prefab } from "cc";
import { reward } from "./reward";
import { poolManager } from "./poolManager";
const { ccclass, property } = _decorator;

@ccclass("rewardManager")
export class rewardManager extends Component {
  @property({ type: Prefab, tooltip: "奖励预制体" })
  reward0Prefab: Prefab = null;
  @property({ type: Prefab, tooltip: "奖励预制体" })
  reward1Prefab: Prefab = null;
  @property
  reward0Rate: number = 1;
  @property
  reward1Rate: number = 1;

  start() {
    this.schedule(this.reward0Spawn, this.reward0Rate);
    this.schedule(this.reward1Spawn, this.reward1Rate);
  }

  rewardSpawn(prefab: Prefab, x: number, y: number) {
    const reward = poolManager.instance().getNode(prefab, this.node);
    reward.setPosition(math.randomRangeInt(-x, x), y);
  }

  reward0Spawn() {
    this.rewardSpawn(this.reward0Prefab, 205, 480);
  }
  reward1Spawn() {
    this.rewardSpawn(this.reward1Prefab, 205, 480);
  }
}
