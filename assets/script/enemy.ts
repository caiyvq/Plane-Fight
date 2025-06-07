import {
  _decorator,
  Animation,
  AnimationClip,
  AnimationComponent,
  Collider2D,
  Component,
  Contact2DType,
  CurveRange,
  Node,
  RigidBody2D,
  Sprite,
  SpriteFrame,
} from "cc";
import { poolManager } from "./poolManager";
import { CollisionGroup, player } from "./player";
const { ccclass, property } = _decorator;

@ccclass("enemy")
export class enemy extends Component {
  @property
  speed: number = 100;
  @property
  lifePoint: number = 1;
  @property({ type: Animation, displayName: "动画器" })
  animation: Animation = null;
  @property({ type: AnimationClip, displayName: "待机动画" })
  idleAnim: AnimationClip = null;
  @property({ type: AnimationClip, displayName: "死亡动画" })
  dieAnim: AnimationClip = null;
  @property({ type: AnimationClip, displayName: "受击动画" })
  hitAnim: AnimationClip = null;

  currentSpeed: number = 0;
  @property
  currentLifePoint: number = 0;
  collider: Collider2D = null;

  protected start(): void {
    this.currentSpeed = this.speed;
    this.currentLifePoint = this.lifePoint;
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
    // console.log(other.node.name);
    this.currentLifePoint--;
    if (this.currentLifePoint <= 0) {
      this.die();
    } else {
      this.hit();
    }
  }

  die() {
    // console.log("die");
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
  }
}
