import {
  _decorator,
  Collider2D,
  Component,
  Contact2DType,
  Enum,
  Node,
} from "cc";
import { poolManager } from "./poolManager";
const { ccclass, property } = _decorator;

export enum RewardType {
  TwoShot,
  Bomb,
}

@ccclass("reward")
export class reward extends Component {
  @property
  speed: number = 100;
  @property({ type: Enum(RewardType), tooltip: "奖励类型" })
  rewardType: RewardType = RewardType.TwoShot;

  collider: Collider2D = null;

  start() {
    this.collider = this.getComponent(Collider2D);
    if (this.collider) {
      this.collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }
  }

  protected onDestroy(): void {
    if (this.collider) {
      this.collider.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }
  }

  update(deltaTime: number) {
    const p = this.node.position;
    this.node.setPosition(p.x, p.y - this.speed * deltaTime);
    if (this.node.position.y < -600) {
      poolManager.instance().putNode(this.node);
    }
  }

  onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D) {
    this.collider.enabled = false;
    this.scheduleOnce(() => {
      poolManager.instance().putNode(this.node);
    }, 0.05);
  }

  protected onEnable(): void {
    this.init();
  }

  init() {
    if (this.collider) {
      this.collider.enabled = true;
    }
  }
}
