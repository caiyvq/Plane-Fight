import { _decorator, Component, director, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('startUI')
export class startUI extends Component {
    start() {

    }

    update(deltaTime: number) {
        
    }

    onStartButtonClick() {
        director.loadScene("gameScene");
    }
}


