import { _decorator, Component, director, game, Node } from 'cc';
import { GameEvents } from './gameManager';
import { AudioTypes } from './audioManager';
const { ccclass, property } = _decorator;

@ccclass('startUI')
export class startUI extends Component {
    start() {

    }

    update(deltaTime: number) {
        
    }

    onStartButtonClick() {
        game.emit(GameEvents.AUDIO_PLAY,AudioTypes.PRESS_BUTTON);
        director.loadScene("gameScene");
    }
}


