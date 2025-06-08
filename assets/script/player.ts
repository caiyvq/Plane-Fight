import {
  _decorator,
  Animation,
  AnimationClip,
  Collider2D,
  Color,
  Component,
  Contact2DType,
  Enum,
  EventMouse,
  EventTouch,
  game,
  Input,
  input,
  instantiate,
  math,
  Node,
  Prefab,
  Sprite,
  Vec3,
} from "cc";
import { bullet } from "./bullet";
import { poolManager } from "./poolManager";
import { reward, RewardType } from "./reward";
import { GameEvents, gameManager } from "./gameManager";
const { ccclass, property } = _decorator;

enum ShootType {
  OneShoot,
  TwoShoot,
  IceShoot,
  None,
}

export enum CollisionGroup {
  Player = 1 << 1,
  Enemy = 1 << 2,
  Bullet = 1 << 3,
  Reward = 1 << 4,
  Player_Invincible = 1 << 5,
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
  @property({ type: Node, tooltip: "单发子弹初始位置" })
  position0: Node = null;
  @property({ type: Node, tooltip: "双发子弹初始位置" })
  position1: Node = null;
  @property({ type: Node, tooltip: "双发子弹初始位置" })
  position2: Node = null;
  @property({ type: Enum(ShootType) })
  shootType: ShootType = ShootType.OneShoot;
  @property({ displayName: "最大生命值" })
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
  isCollidingBomb: boolean = false;
  isCollidingIce: boolean = false;
  isCollidingEnemy: boolean = false;
  controllable: boolean = true;
  aliveScore: number = 0;
  energy: number = 0;
  maxEnergy: number = 10;
  fullEnergyState: boolean = false;

  onLoad() {
    input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
    input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
    game.on(GameEvents.PLAYER_DISABLE, this.disableControl, this);
    game.on(GameEvents.PLAYER_ENABLE, this.enableControl, this);
    game.on(
      GameEvents.ENERGY_ADD,
      //@ts-ignore
      (energy: number) => {
        this.addEnergy(energy);
      },
      this
    );
  }

  onDestroy() {
    input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
    input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
    game.off(GameEvents.PLAYER_DISABLE, this.disableControl, this);
    game.off(GameEvents.PLAYER_ENABLE, this.enableControl, this);
    game.off(
      GameEvents.ENERGY_ADD,
      //@ts-ignore
      (energy: number) => {
        this.addEnergy(energy);
      },
      this
    );
  }

  protected start(): void {
    this.currentLifePoint = this.lifePoint;
    this.collider = this.node.getComponent(Collider2D);
    if (this.collider) {
      this.collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }
    game.emit("Life Change", this.currentLifePoint);
  }

  update(dt: number) {
    this.shootTimer += dt;
    if (this.shootTimer >= this.shootRate) {
      this.shootTimer = 0;
      this.shoot();
    }
    this.aliveScore += dt;
    if (this.aliveScore >= 0.1) {
      game.emit(GameEvents.SCORE_ADD, Math.floor(this.aliveScore * 10));
      this.aliveScore = 0;
    }
  }

  onTouchMove(event: EventTouch) {
    //console.log(event);
    //if(director.isPaused()) return;
    if (!this.controllable) return;

    let p = new Vec3(
      this.node.position.x + event.getDeltaX(),
      this.node.position.y + event.getDeltaY()
    );
    this.node.setPosition(
      Math.min(Math.max(p.x, this.leftBound), this.rightBound),
      Math.min(Math.max(p.y, this.downBound), this.upBound)
    );
  }

  //击杀敌人获得一定能量后可以开启双弹
  onMouseDown(event: EventMouse) {
    // console.log(event.getButton());
    if (event.getButton() == 2) {
      if (this.shootType == ShootType.OneShoot && this.fullEnergyState) {
        // console.log('one to two');
        this.switchShootType(ShootType.TwoShoot);
        this.releaseEnergy();
      }
    }
  }

  addEnergy(energy: number) {
    if (this.energy < this.maxEnergy && this.shootType != ShootType.TwoShoot) {
      this.energy += energy;
      console.log("add energy");
    }
    if (this.energy >= this.maxEnergy && !this.fullEnergyState) {
      this.fullEnergyState = true;
      this.node.getComponentInChildren(Sprite).color = new Color(
        255,
        255,
        0,
        255
      );
    }
  }

  releaseEnergy() {
    this.energy = 0;
    this.fullEnergyState = false;
    this.node.getComponentInChildren(Sprite).color = new Color(
      255,
      255,
      255,
      255
    );
  }

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

  //TODO:机制修改：常态单发，拾取资源变冷冻，能量满时常态和冷冻都可变双发
  shoot() {
    switch (this.shootType) {
      case ShootType.OneShoot:
        this.oneShoot();
        break;
      case ShootType.TwoShoot:
        this.twoShoot();
        break;
      case ShootType.IceShoot:
        this.iceShoot();
        break;
      case ShootType.None:
        break;
    }
  }

  oneShoot() {
    let bullet = poolManager
      .instance()
      .getNode(this.bullet1Prefab, this.bulletParent);
    bullet.setWorldPosition(this.position0.worldPosition);
  }

  twoShoot() {
    let bullet1 = poolManager
      .instance()
      .getNode(this.bullet1Prefab, this.bulletParent);
    bullet1.setWorldPosition(this.position1.worldPosition);

    let bullet2 = poolManager
      .instance()
      .getNode(this.bullet1Prefab, this.bulletParent);
    bullet2.setWorldPosition(this.position2.worldPosition);
  }

  iceShoot() {
    let bullet = poolManager
      .instance()
      .getNode(this.bullet2Prefab, this.bulletParent);
    bullet.setWorldPosition(this.position0.worldPosition);
  }

  contactReward(otherCollider: Collider2D) {
    // console.log("contact reward");
    switch (otherCollider.node.getComponent(reward).rewardType) {
      case RewardType.IceShoot:
        this.collidingIce();
        break;
      case RewardType.Bomb:
        // console.log("send Get Bomb event");
        this.collidingBomb();
        break;
    }
  }

  collidingIce() {
    if (this.isCollidingIce) return;
    this.isCollidingIce = true;
    this.switchShootType(ShootType.IceShoot);
    this.scheduleOnce(() => {
      this.isCollidingIce = false;
    }, 0);
  }

  collidingBomb() {
    if (this.isCollidingBomb) return;
    this.isCollidingBomb = true;
    game.emit(GameEvents.GET_BOMB);
    this.scheduleOnce(() => {
      this.isCollidingBomb = false;
    }, 0);
  }

  switchShootType(shootType: ShootType) {
    // console.log("switch shoot type to " + shootType);
    this.shootType = shootType;

    if (this.resetShootTypeTimer !== null) {
      // console.log("unschedule");
      this.unschedule(this.resetShootTypeTimer);
    }

    this.resetShootTypeTimer = () => {
      this.shootType = ShootType.OneShoot;
      // console.log("switch one shoot type");
      this.resetShootTypeTimer = null;
    };
    this.scheduleOnce(this.resetShootTypeTimer, 5);
  }

  contactEnemy() {
    // console.log("contact enemy");
    if(this.isCollidingEnemy) return;
    this.isCollidingEnemy = true;

    this.currentLifePoint--;
    game.emit(GameEvents.LIFE_CHANGE, this.currentLifePoint);
    if (this.currentLifePoint <= 0) {
      this.die();
    } else {
      this.hit();
    }
    //防止一帧多次撞击
    this.scheduleOnce(() => {
      this.isCollidingEnemy = false;
    }, 0);
  }

  hit() {
    if (this.animation && this.hitAnim) {
      this.animation.play(this.hitAnim.name);
    }
    this.collider.group = CollisionGroup.Player_Invincible;
    this.scheduleOnce(() => {
      this.collider.group = CollisionGroup.Player;
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
      game.emit(GameEvents.GAME_OVER);
    }, this.dieAnim.duration);
  }

  disableControl() {
    this.controllable = false;
  }

  enableControl() {
    this.controllable = true;
  }
}
