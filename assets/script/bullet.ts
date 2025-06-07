import { _decorator, Collider2D, Component, Contact2DType, Enum, Node } from "cc";
import { poolManager } from "./poolManager";
const { ccclass, property } = _decorator;

export enum BulletType {
  Normal,
  Ice
}

@ccclass("bullet")
export class bullet extends Component {
  @property({ tooltip: "子弹速度" })
  speed: number = 400;
  @property({type:Enum(BulletType), displayName: "子弹类型"})
  bulletType: BulletType = BulletType.Normal;

  collider: Collider2D = null;

  start() {
    this.collider = this.node.getComponent(Collider2D);
    if (this.collider) {
      // console.log("get collider");
      this.collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }
  }

  protected onDestroy(): void {
    if (this.collider) {
      this.collider.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }
  }

  onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D) {
    // console.log("bullet hit enemy");
    this.collider.enabled = false;
    this.scheduleOnce(() => {
      poolManager.instance().putNode(this.node);
    }, 0.05);
  }

  update(deltaTime: number) {
    const p = this.node.position;
    this.node.setPosition(p.x, p.y + this.speed * deltaTime);
    if (this.node.position.y > 435) {
      poolManager.instance().putNode(this.node);
    }
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
