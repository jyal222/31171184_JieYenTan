// Models
// cited from asteroid05

export type Key = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'Space' | ' '
export type KeyEvent = 'keydown' | 'keyup'
// Moves either left, right or stay still
export type Movement = 1.5 | -1.5 | 0
// our game has the following view element types:
export type BulletView = 'bullet' | 'alienBullet'
export type ViewType = 'spaceship' | 'alien' | BulletView | 'shield' | 'heart'

// Six types of game state transitions
export class Tick {
  constructor(public readonly elapsed: number) {}
}
export class Move {
  constructor(public readonly direction: Movement) {}
}
export class Shoot {
  constructor() {}
}

export class AlienMove {
  constructor(public readonly vel: Vec) {}
}

export class AlienShoot {
  constructor() {}
}

export class AddLife {
  constructor(public readonly pos: Vec) {}
}

export type Obj = Readonly<{ pos: Vec }>
export type Size = Readonly<{ width: number; height: number }>
export type ObjectId = Readonly<{ id: string; createTime: number }>

// cited from asteroid05
interface IBod extends Obj, ObjectId {
  viewType: ViewType
  width: number
  height: number
  vel: Vec
}

// cited from asteroid05
interface IState {
  time: number
  spaceship: Bod
  bullets: ReadonlyArray<Bod>
  alienBullets: ReadonlyArray<Bod>
  aliens: ReadonlyArray<Bod>
  shields: ReadonlyArray<Bod>
  exit: ReadonlyArray<Bod>
  objCount: number
  gameOver: boolean
  score: number
  highscore: number
  level: number
  alienSpeed: number
  nextLevel: boolean
  life: number
  hearts: ReadonlyArray<Bod>
}

// Every object that participates in physics is a Bod
export type Bod = Readonly<IBod>

// Game state
export type State = Readonly<IState>

// Game setting
export type GameSetting = Readonly<{
  score: number
  highscore: number
  alienSpeed: number
  level: number
  life: number
}>

/**
 * A simple immutable vector class
 * cited from asteroid05
 */
export class Vec {
  constructor(public readonly x: number = 0, public readonly y: number = 0) {}
  add = (b: Vec) => new Vec(this.x + b.x, this.y + b.y)

  static Zero = new Vec()
}
