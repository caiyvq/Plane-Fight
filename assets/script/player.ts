import {
  _decorator,
  Animation,
  AnimationClip,
  Collider2D,
  Component,
  Enum,
  EventTouch,
  Input,
  input,
  instantiate,
  math,
  Node,
  Prefab,
  Vec3,
} from "cc";
import { bullet } from "./bullet";
import { poolManager } from "./poolManager";
const { ccclass, property } = _decorator;

enum ShootType {
  OneShot,
  TwoShot,
}

@ccclass("player")
export class player extends Component {
  @property({ tooltip: "子弹发射时间间隔" })
  shootRate: number = 0.5;
  @property(Prefab)
  bullet1Prefab: Prefab = null;
  @property(Prefab)
  bullet2Prefab: Prefab = null;
  @property({ type: Node, tooltip: "所有子弹的父节点" })
  bulletParent: Node = null;
  @property({ type: Node, tooltip: "子弹一的初始位置" })
  bullet1Position: Node = null;
  @property({ type: Node, tooltip: "子弹二的初始位置" })
  bullet2Position1: Node = null;
  @property({ type: Node, tooltip: "子弹二的初始位置" })
  bullet2Position2: Node = null;
  @property({ type: Enum(ShootType) })
  shootType: ShootType = ShootType.OneShot;
  @property
  lifePoint: number = 5;
  @property({ type: Animation, displayName: "动画器" })
  animation: Animation = null;
  @property({ type: AnimationClip, displayName: "死亡动画" })
  dieAnim: AnimationClip = null;
  @property({ type: AnimationClip, displayName: "待机动画" })
  idleAnim: AnimationClip = null;
  @property({ type: AnimationClip, displayName: "受击动画" })
  hitAnim: AnimationClip = null;

  collider:Collider2D=null;
  currentLifePoint: number = 0;
  shootTimer: number = 0;
  leftBound: number = -230;
  rightBound: number = 230;
  upBound: number = 390;
  downBound: number = -410;

  onLoad() {
    input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
  }

  onDestroy() {
    input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
  }

  protected start(): void {
    this.currentLifePoint = this.lifePoint;
    this.collider=this.node.getComponent(Collider2D);
  }

  update(dt: number) {
    this.shootTimer += dt;
    if (this.shootTimer >= this.shootRate) {
      this.shootTimer = 0;
      this.shoot();
    }
  }

  onTouchMove(event: EventTouch) {
    //console.log(event);
    let p = new Vec3(
      this.node.position.x + event.getDeltaX(),
      this.node.position.y + event.getDeltaY()
    );
    this.node.setPosition(
      Math.min(Math.max(p.x, this.leftBound), this.rightBound),
      Math.min(Math.max(p.y, this.downBound), this.upBound)
    );
  }

  shoot() {
    switch (this.shootType) {
      case ShootType.OneShot:
        this.oneShoot();
        break;
      case ShootType.TwoShot:
        this.twoShoot();
        break;
    }
  }

  oneShoot() {
    let bullet1 = poolManager
      .instance()
      .getNode(this.bullet1Prefab, this.bulletParent);
    bullet1.setWorldPosition(this.bullet1Position.worldPosition);
  }

  twoShoot() {
    let bullet2_1 = poolManager
      .instance()
      .getNode(this.bullet2Prefab, this.bulletParent);
    bullet2_1.setWorldPosition(this.bullet2Position1.worldPosition);

    let bullet2_2 = poolManager
      .instance()
      .getNode(this.bullet2Prefab, this.bulletParent);
    bullet2_2.setWorldPosition(this.bullet2Position2.worldPosition);
  }

  hit() {
    console.log("hp-1");
    this.currentLifePoint--;
    if (this.currentLifePoint <= 0) {
      this.die();
    }
    else{
      if(this.animation&&this.hitAnim){
        this.animation.play(this.hitAnim.name);
      }
      this.collider.enabled=false;
      this.scheduleOnce(()=>{this.collider.enabled=true;},this.hitAnim.duration);
    }
  }

  die() {
    if(this.collider){
      this.collider.enabled=false;
    }
    if (this.animation && this.dieAnim) {
      this.animation.play(this.dieAnim.name);
    }
    this.schedule(() => {
      this.node.destroy();
    }, this.dieAnim.duration);
  }
}
