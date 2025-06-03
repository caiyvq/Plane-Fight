import { _decorator, Component, Node } from "cc";
import { poolManager } from "./poolManager";
const { ccclass, property } = _decorator;

@ccclass("enemy")
export class enemy extends Component {
  @property
  speed: number = 100;

  start() {}

  update(deltaTime: number) {
    const p = this.node.position;
    this.node.setPosition(p.x, p.y - this.speed * deltaTime);

    if (p.y < -600) {
      poolManager.instance().putNode(this.node);
    }
  }
}
