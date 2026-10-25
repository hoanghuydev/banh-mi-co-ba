import Phaser from "phaser";
import { music } from "../audio/music";
import { warmNpcPhotos } from "../art";
import { MenuDom } from "../ui/menu/MenuDom";

export class MenuScene extends Phaser.Scene {
  private dom?: MenuDom;

  constructor() { super("menu"); }

  create() {
    this.dom = new MenuDom(this, (key, data) => this.scene.start(key, data));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.dom?.close(); this.dom = undefined; });
    music.play("menu");
    warmNpcPhotos(this);
  }
}
