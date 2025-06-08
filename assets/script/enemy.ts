import {
  _decorator,
  Animation,
  AnimationClip,
  AnimationComponent,
  Collider2D,
  Component,
  Contact2DType,
  CurveRange,
  game,
  Node,
  RigidBody2D,
  Sprite,
  SpriteFrame,
} from "cc";
import { poolManager } from "./poolManager";
import { CollisionGroup, player } from "./player";
import { bullet, BulletType } from "./bullet";
import { GameEvents, gameManager } from "./gameManager";
const { ccclass, property } = _decorator;

@ccclass("enemy")
export class enemy extends Component {
  @property
  speed: number = 100;
  @property({ displayName: "最大血量" })
  lifePoint: number = 1;
  @property({ type: Animation, displayName: "动画器" })
  animation: Animation = null;
  @property({ type: AnimationClip, displayName: "待机动画" })
  idleAnim: AnimationClip = null;
  @property({ type: AnimationClip, displayName: "死亡动画" })
  dieAnim: AnimationClip = null;
  @property({ type: AnimationClip, displayName: "受击动画" })
  hitAnim: AnimationClip = null;
  @property({ type: AnimationClip, displayName: "冻结动画" })
  freezeAnim: AnimationClip = null;
  @property({displayName:'分值'})
  score: number = 10;

  currentSpeed: number = 0;
  currentLifePoint: number = 0;
  sprite: Sprite = null;
  collider: Collider2D = null;
  unFreeze: Function = null;
  isColliding: boolean = false;

  protected start(): void {
    this.currentSpeed = this.speed;
    this.currentLifePoint = this.lifePoint;
    this.sprite = this.node.getComponentInChildren(Sprite);
    this.collider = this.node.getComponent(Collider2D);
    if (this.collider) {
      // console.log('get collider');
      this.collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }
  }

  protected onDestroy(): void {
    if (this.collider) {
      this.collider.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }
  }

  onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D) {
    // console.log(typeof(otherCollider.node));
    //防止一帧多次撞击
    if(this.isColliding){
      return;
    }
    this.isColliding = true;

    const bulletComp = otherCollider.node.getComponent(bullet);
    this.currentLifePoint--;
    if (this.currentLifePoint <= 0) {
      this.die();
    } else {
      if (bulletComp && bulletComp.bulletType === BulletType.Ice) {
        this.freeze();
      } else {
        this.hit();
      }
    }

    this.scheduleOnce(()=>{this.isColliding = false;}, 0);
  }

  die() {
    // console.log("die");
    game.emit(GameEvents.SCORE_ADD, this.score);
    if (this.collider) {
      this.collider.enabled = false;
    }
    if (this.animation && this.dieAnim) {
      this.animation.play(this.dieAnim.name);
    }
    this.currentSpeed = 0;
    this.scheduleOnce(this.afterDie, this.dieAnim.duration);
  }

  afterDie() {
    // console.log("destroy");
    poolManager.instance().putNode(this.node);
  }

  hit() {
    // console.log('hit');
    if (this.animation && this.hitAnim) {
      this.animation.play(this.hitAnim.name);
    }
  }

  freeze() {
    // console.log("freeze");

    this.currentSpeed = this.speed / 2;

    if (this.animation && this.freezeAnim) {
      this.animation.play(this.freezeAnim.name);
    }

    if (this.unFreeze !== null) {
      this.unschedule(this.unFreeze);
    }

    this.unFreeze = () => {
      this.currentSpeed = this.speed;
      this.unFreeze = null;
    };
    this.scheduleOnce(this.unFreeze, this.freezeAnim?.duration);
  }

  update(deltaTime: number) {
    const p = this.node.position;
    this.node.setPosition(p.x, p.y - this.currentSpeed * deltaTime);

    if (p.y < -600) {
      poolManager.instance().putNode(this.node);
    }
  }

  protected onEnable(): void {
    this.init();
  }

  init() {
    if (this.animation && this.idleAnim) {
      this.animation.play(this.idleAnim.name);
    }
    this.currentSpeed = this.speed;
    this.currentLifePoint = this.lifePoint;
    if (this.collider) {
      this.collider.enabled = true;
    }
    this.sprite?.color.set(255, 255, 255, 255);
  }
}
