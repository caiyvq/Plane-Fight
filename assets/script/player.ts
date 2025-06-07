import {
  _decorator,
  Animation,
  AnimationClip,
  Collider2D,
  Component,
  Contact2DType,
  Enum,
  EventMouse,
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
import { reward, RewardType } from "./reward";
const { ccclass, property } = _decorator;

enum ShootType {
  OneShoot,
  TwoShoot,
  Bomb,
  None,
}

export enum CollisionGroup {
  Player = 1 << 1,
  Enemy = 1 << 2,
  Bullet = 1 << 3,
  Reward = 1 << 4,
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
  @property({ type: Node, tooltip: "子弹二的初始位置1" })
  bullet2Position1: Node = null;
  @property({ type: Node, tooltip: "子弹二的初始位置2" })
  bullet2Position2: Node = null;
  @property({ type: Enum(ShootType) })
  shootType: ShootType = ShootType.OneShoot;
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

  collider: Collider2D = null;
  currentLifePoint: number = 0;
  shootTimer: number = 0;
  leftBound: number = -230;
  rightBound: number = 230;
  upBound: number = 390;
  downBound: number = -410;
  resetShootTypeTimer: Function = null;

  onLoad() {
    input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
    // input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
  }

  onDestroy() {
    input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
    // input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
  }

  protected start(): void {
    this.currentLifePoint = this.lifePoint;
    this.collider = this.node.getComponent(Collider2D);
    if (this.collider) {
      this.collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }
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

  // onMouseDown(event: EventMouse) {
  //   // console.log(event.getButton());
  //   if (event.getButton() == 2) {
  //     if (this.shootType == ShootType.OneShot) {
  //       // console.log('one to two');
  //       this.shootType = ShootType.TwoShot;
  //     } else if (this.shootType == ShootType.TwoShot) {
  //       // console.log('two to one');
  //       this.shootType = ShootType.OneShot;
  //     }
  //   }
  // }

  onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D) {
    // console.log(otherCollider.group);
    switch (otherCollider.group) {
      case CollisionGroup.Enemy:
        this.contactEnemy();
        break;
      case CollisionGroup.Reward:
        this.contactReward(otherCollider);
        break;
    }
  }

  shoot() {
    switch (this.shootType) {
      case ShootType.OneShoot:
        this.oneShoot();
        break;
      case ShootType.TwoShoot:
        this.twoShoot();
        break;
      case ShootType.Bomb:
        this.bomb();
        break;
      case ShootType.None:
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

  bomb() {
    console.log("bomb");
  }

  contactReward(otherCollider: Collider2D) {
    // console.log("contact reward");
    if (this.resetShootTypeTimer !== null) {
      console.log("unschedule");
      this.unschedule(this.resetShootTypeTimer);
    }

    switch (otherCollider.node.getComponent(reward).rewardType) {
      case RewardType.TwoShot:
        this.shootType = ShootType.TwoShoot;
        break;
      case RewardType.Bomb:
        this.shootType = ShootType.Bomb;
        break;
    }
    this.resetShootTypeTimer = () => {
      this.shootType = ShootType.OneShoot;
      console.log("one shoot");
      this.resetShootTypeTimer = null;
    };
    this.scheduleOnce(this.resetShootTypeTimer, 5);
  }

  contactEnemy() {
    // console.log("contact enemy");
    this.currentLifePoint--;
    if (this.currentLifePoint <= 0) {
      this.die();
    } else {
      this.hit();
    }
  }

  hit() {
    if (this.animation && this.hitAnim) {
      this.animation.play(this.hitAnim.name);
    }
    this.collider.enabled = false;
    this.scheduleOnce(() => {
      this.collider.enabled = true;
    }, this.hitAnim.duration);
  }

  die() {
    if (this.collider) {
      this.collider.enabled = false;
    }
    this.shootType = ShootType.None;
    if (this.animation && this.dieAnim) {
      this.animation.play(this.dieAnim.name);
    }
    this.schedule(() => {
      this.node.destroy();
    }, this.dieAnim.duration);
  }
}
