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
import { bullet, BulletType } from './bullet';
import { poolManager } from "./poolManager";
import { reward, RewardType } from "./reward";
import { GameEvents, gameManager } from "./gameManager";
import { AudioTypes } from "./audioManager";
const { ccclass, property } = _decorator;

enum ShootType {
  OneShoot,
  TwoShoot,
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
  @property({ type: [Prefab], tooltip: "子弹预制体" })
  bulletPrefab: Prefab[] = [];
  @property({ type: Node, tooltip: "所有子弹的父节点" })
  bulletParent: Node = null;
  @property({ type: Node, tooltip: "单发子弹初始位置" })
  position0: Node = null;
  @property({ type: Node, tooltip: "双发子弹初始位置" })
  position1: Node = null;
  @property({ type: Node, tooltip: "双发子弹初始位置" })
  position2: Node = null;
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

  collider: Collider2D = null; //碰撞器
  currentLifePoint: number = 0; //当前生命值
  shootTimer: number = 0; //子弹发射计时器
  leftBound: number = -230;//左边界
  rightBound: number = 230;//右边界
  upBound: number = 390;//上边界
  downBound: number = -410;//下边界
  resetShootTypeTimer: Function = null; //重置射击类型计时器
  resetBulletTypeTimer: Function = null; //重置子弹类型计时器
  isCollidingBomb: boolean = false; //是否正在碰撞炸弹奖励
  isCollidingIce: boolean = false; //是否正在碰撞冰冻奖励
  isCollidingEnemy: boolean = false; //是否正在碰撞敌人
  controllable: boolean = true; //是否可控
  aliveScore: number = 0; //存活分数
  energy: number = 0; //当前能量值
  maxEnergy: number = 10; //最大能量值
  fullEnergyState: boolean = false; //是否满能量状态
  lastClickTime: number = 0; //上次点击时间
  private readonly DOUBLE_CLICK_TIME_INTERVAL: number = 300; //双击时间间隔
  shootType: ShootType = ShootType.OneShoot;  //射击类型
  bulletType: BulletType = BulletType.Normal; //子弹类型

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

  update(deltaTime: number) {
    this.shootTimer += deltaTime;
    if (this.shootTimer >= this.shootRate) {
      this.shootTimer = 0;
      this.shoot();
    }
    this.aliveScore += deltaTime;
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
    const currentTime = game.totalTime;
    // console.log('currentTime: ', currentTime, ' lastClickTime: ', this.lastClickTime);

    if (event.getButton() == 2) {
      if (this.shootType == ShootType.OneShoot && this.fullEnergyState) {
        // console.log('one to two');
        this.switchShootType(ShootType.TwoShoot);
        this.releaseEnergy();
      }
    }

    if (event.getButton() == 0) {
      if(currentTime - this.lastClickTime <= this.DOUBLE_CLICK_TIME_INTERVAL) {
        this.onDoubleClick();
        this.lastClickTime = 0; // 重置上次点击时间
      }else{
        this.lastClickTime = currentTime; // 更新上次点击时间
      }
    }
  }

  onDoubleClick() {
    // console.log("double click");
    game.emit(GameEvents.USE_BOMB);
  }

  addEnergy(energy: number) {
    if (this.energy < this.maxEnergy && this.shootType != ShootType.TwoShoot) {
      this.energy += energy;
      // console.log("add energy");
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

  //常态单发，拾取资源变冷冻，能量满时常态和冷冻都可变双发
  shoot() {
    switch (this.shootType) {
      case ShootType.OneShoot:
        this.oneShoot();
        break;
      case ShootType.TwoShoot:
        this.twoShoot();
        break;
      case ShootType.None:
        break;
    }
  }

  oneShoot() {
    let bullet = poolManager
      .instance()
      .getNode(this.bulletPrefab[this.bulletType], this.bulletParent);
    bullet.setWorldPosition(this.position0.worldPosition);
  }

  twoShoot() {
    let bullet1 = poolManager
      .instance()
      .getNode(this.bulletPrefab[this.bulletType], this.bulletParent);
    bullet1.setWorldPosition(this.position1.worldPosition);

    let bullet2 = poolManager
      .instance()
      .getNode(this.bulletPrefab[this.bulletType], this.bulletParent);
    bullet2.setWorldPosition(this.position2.worldPosition);
  }

  // iceShoot() {
  //   let bullet = poolManager
  //     .instance()
  //     .getNode(this.bulletPrefab[this.bulletType], this.bulletParent);
  //   bullet.setWorldPosition(this.position0.worldPosition);
  // }

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

    this.switchBulletType(BulletType.Ice);
    game.emit(GameEvents.AUDIO_PLAY,AudioTypes.GET_ICE_BULLET);

    this.scheduleOnce(() => {
      this.isCollidingIce = false;
    }, 0);
  }

  collidingBomb() {
    if (this.isCollidingBomb) return;
    this.isCollidingBomb = true;

    game.emit(GameEvents.GET_BOMB);
    game.emit(GameEvents.AUDIO_PLAY,AudioTypes.GET_BOMB);

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

    this.scheduleOnce(this.resetShootTypeTimer, 10);
  }

  switchBulletType(bulletType: BulletType) {
    // console.log("switch shoot type to " + shootType);
    this.bulletType = bulletType;

    if (this.resetBulletTypeTimer !== null) {
      // console.log("unschedule");
      this.unschedule(this.resetBulletTypeTimer);
    }

    this.resetBulletTypeTimer = () => {
      this.bulletType = BulletType.Normal;
      this.resetBulletTypeTimer = null;
    };

    this.scheduleOnce(this.resetBulletTypeTimer, 5);
  }

  contactEnemy() {
    // console.log("contact enemy");
    if (this.isCollidingEnemy) return;
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
    game.emit(GameEvents.AUDIO_PLAY,AudioTypes.PLAYER_DIE);
    
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
