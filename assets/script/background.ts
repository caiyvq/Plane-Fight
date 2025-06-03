import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('background')
export class background extends Component {

    @property(Node)
    public background01: Node = null;
    @property(Node)
    public background02: Node = null;
    @property({ tooltip:"背景移动速度" })
    speed: number = 100;

    backgroundHeight: number = 852;

    start() {

    }

    update(deltaTime: number) {
        let pos1 = this.background01.position;
        this.background01.setPosition(pos1.x, pos1.y - this.speed * deltaTime);
        let pos2 = this.background02.position;
        this.background02.setPosition(pos2.x, pos2.y - this.speed * deltaTime);

        pos1 = this.background01.position;
        pos2 = this.background02.position;
        if (this.background01.y <= -this.backgroundHeight) {
            this.background01.setPosition(pos1.x, pos2.y + this.backgroundHeight);
        }
        if (this.background02.y <= -this.backgroundHeight) {
            this.background02.setPosition(pos2.x, pos1.y + this.backgroundHeight);
        }
    }
}


