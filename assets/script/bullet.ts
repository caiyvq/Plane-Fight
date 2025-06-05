import { _decorator, Component, Node } from 'cc';
import { poolManager } from './poolManager';
const { ccclass, property } = _decorator;

@ccclass('bullet')
export class bullet extends Component {

    @property({ tooltip: "子弹速度" })
    speed: number = 400;

    start() {

    }

    update(deltaTime: number) {
        const p = this.node.position;
        this.node.setPosition(p.x, p.y + this.speed * deltaTime);
        if (this.node.position.y > 435) {
            poolManager.instance().putNode(this.node);
        }
    }
}


