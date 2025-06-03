import {
  _decorator,
  Component,
  instantiate,
  math,
  Node,
  Prefab,
  random,
} from "cc";
import { poolManager } from "./poolManager";
import { enemy } from "./enemy";
const { ccclass, property } = _decorator;

@ccclass("enemyManager")
export class enemyManager extends Component {
  @property(Prefab)
  enemy0Prefab: Prefab = null;
  @property(Prefab)
  enemy1Prefab: Prefab = null;
  @property(Prefab)
  enemy2Prefab: Prefab = null;
  @property
  enemy0Rate: number = 1;
  @property
  enemy1Rate: number = 1;
  @property
  enemy2Rate: number = 1;

  enemy0timer: number = 0;
  enemy1timer: number = 0;
  enemy2timer: number = 0;

  start() {}

  update(deltaTime: number) {
    this.enemy0timer += deltaTime;
    if (this.enemy0timer > this.enemy0Rate) {
      this.enemy0timer = 0;
      this.enemy0Spawn();
    }
    this.enemy1timer += deltaTime;
    if (this.enemy1timer > this.enemy1Rate) {
      this.enemy1timer = 0;
      this.enemy1Spawn();
    }
    this.enemy2timer += deltaTime;
    if (this.enemy2timer > this.enemy2Rate) {
      this.enemy2timer = 0;
      this.enemy2Spawn();
    }
  }

  enemy0Spawn() {
    const enemy0 = poolManager.instance().getNode(this.enemy0Prefab, this.node);
    let x = math.randomRangeInt(-215, 215);
    let y = 475;
    enemy0.setPosition(x, y);
  }
  enemy1Spawn() {
    const enemy1 = poolManager.instance().getNode(this.enemy1Prefab, this.node);
    let x = math.randomRangeInt(-200, 200);
    let y = 475;
    enemy1.setPosition(x, y);
  }
  enemy2Spawn() {
    const enemy2 = poolManager.instance().getNode(this.enemy2Prefab, this.node);
    let x = math.randomRangeInt(-154, 154);
    let y = 560;
    enemy2.setPosition(x, y);
  }
}
