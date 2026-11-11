// Personaje animado: respira, parpadea, cambia de expresión y habla.
import Phaser from 'phaser';

export class Character extends Phaser.GameObjects.Container {
  constructor(scene, x, y, who, { scale = 1, expr = 'happy', flip = false } = {}) {
    super(scene, x, y);
    this.who = who;
    this.expr = expr;
    this.baseScale = scale;
    this.shadow = scene.add.ellipse(0, 0, 300, 50, 0x000000, 0.18);
    this.sprite = scene.add.image(0, 0, `${who}-${expr}`).setOrigin(0.5, 1).setFlipX(flip);
    this.add([this.shadow, this.sprite]);
    this.setScale(scale);
    scene.add.existing(this);

    // Respiración: se estira y encoge suavemente desde los pies.
    this.breath = scene.tweens.add({
      targets: this.sprite, scaleY: 1.035, scaleX: 0.985, duration: 1100 + Math.random() * 400,
      yoyo: true, repeat: -1, ease: 'Sine.inOut',
    });
    this.blinkTimer = scene.time.addEvent({ delay: 2600 + Math.random() * 2200, loop: true, callback: () => this.blink() });
    this.once('destroy', () => { this.blinkTimer.remove(); this.breath.remove(); });
  }

  setExpression(expr) {
    this.expr = expr;
    this.sprite.setTexture(`${this.who}-${expr}`);
    return this;
  }

  blink() {
    if (!this.active || ['blink', 'talk'].includes(this.expr)) return;
    const back = this.expr;
    this.sprite.setTexture(`${this.who}-blink`);
    this.scene.time.delayedCall(140, () => { if (this.active && this.expr === back) this.sprite.setTexture(`${this.who}-${back}`); });
  }

  // Pequeño salto para llamar la atención.
  hop(height = 40) {
    this.scene.tweens.add({ targets: this.sprite, y: -height, duration: 180, yoyo: true, ease: 'Quad.out' });
    return this;
  }

  // Alterna la boca mientras "habla" y vuelve a la expresión indicada.
  talk(expr, ms = 1200) {
    this.expr = expr;
    let open = false;
    if (this.talkEvent) this.talkEvent.remove();
    const flips = Math.max(2, Math.floor(ms / 150));
    this.talkEvent = this.scene.time.addEvent({
      delay: 150, repeat: flips,
      callback: () => {
        if (!this.active) return;
        open = !open;
        const last = this.talkEvent.repeatCount === 0;
        this.sprite.setTexture(`${this.who}-${open && !last ? 'talk' : expr}`);
      },
    });
    return this;
  }

  stopTalking() {
    if (this.talkEvent) this.talkEvent.remove();
    if (this.active) this.sprite.setTexture(`${this.who}-${this.expr}`);
  }
}
