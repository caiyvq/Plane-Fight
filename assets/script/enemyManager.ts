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

  start() {
    // this.schedule(this.enemy0Spawn, this.enemy0Rate);
    this.schedule(this.enemy1Spawn, this.enemy1Rate);
    // this.schedule(this.enemy2Spawn, this.enemy2Rate);
  }

  protected onDestroy(): void {
    this.unschedule(this.enemy0Spawn);
    this.unschedule(this.enemy1Spawn);
    this.unschedule(this.enemy2Spawn);
  }

  update(deltaTime: number) {
  }

  enemySpawn(prefab:Prefab,x:number,y:number){
    const enemy = poolManager.instance().getNode(prefab, this.node);
    enemy.setPosition(math.randomRangeInt(-x,x),y);
  }

  enemy0Spawn() {
    this.enemySpawn(this.enemy0Prefab,215,475);
  }
  enemy1Spawn() {
    this.enemySpawn(this.enemy1Prefab,200,475);
  }
  enemy2Spawn() {
    this.enemySpawn(this.enemy2Prefab,154,560);
  }
}
