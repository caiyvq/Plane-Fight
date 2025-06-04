import { _decorator, Collider2D, Component, Contact2DType, Node } from "cc";
import { poolManager } from "./poolManager";
const { ccclass, property } = _decorator;

@ccclass("enemy")
export class enemy extends Component {
  @property
  speed: number = 100;
  @property
  lifePoint:number=1;

  collider: Collider2D = null;

  start() {
    this.collider = this.getComponent(Collider2D);
    if (this.collider) {
      this.collider.on(Contact2DType.BEGIN_CONTACT, this.onContactBegin, this);
    }
  }

  protected onDestroy(): void {
    if(this.collider){
      this.collider.off(Contact2DType.BEGIN_CONTACT, this.onContactBegin);
    }
  }

  onContactBegin(selfCollider: Collider2D, otherCollider: Collider2D) {
    if(--this.lifePoint==0){
      poolManager.instance().putNode(selfCollider.node);
    }
  }

  onContactEnd() {}

  update(deltaTime: number) {
    const p = this.node.position;
    this.node.setPosition(p.x, p.y - this.speed * deltaTime);

    if (p.y < -600) {
      poolManager.instance().putNode(this.node);
    }
  }
}
