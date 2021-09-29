import { fromEvent, interval, merge } from 'rxjs'
import { filter, map, scan } from 'rxjs/operators'
import { arr, href, isCollided } from './helpers'
import {
  Obj,
  Bod,
  Key,
  KeyEvent,
  Move,
  ObjectId,
  Shoot,
  Size,
  State,
  Tick,
  Vec,
  ViewType,
  AlienMove,
  AlienShoot,
  BulletView,
  GameSetting,
  AddLife,
} from './models'
import {
  except,
  flatMap,
  isNotNullOrUndefined,
  lastDigit,
  not,
  randInt,
  attr,
  RNG,
} from './utils'

/**
 * Space invader function
 * @param settings game setting
 */
function spaceinvaders(settings: GameSetting) {
  const Constants = {
    CanvasSize: 600,
    BulletVelocity: 1.5,
    BulletWidth: 10,
    BulletHeight: 20,
    BulletExpired: 320,
    AlienWidth: 30,
    AlienHeight: 30,
    ShieldWidth: 10,
    ShieldHeight: 10,
    HeartWidth: 20,
    HeartHeight: 20,
    HeartVelocity: 1.5,
    SpaceshipStartX: 280,
    SpaceshipStartY: 530,
    SpaceshipWidth: 40,
    SpaceshipHeight: 40,
    StartAliensCount: 50,
    StartShieldsCount: 75,
    StartTime: 0,
  } as const
  const rng = new RNG(20)

  // new tick is called every 10 milliseconds
  const gameClock = interval(10).pipe(map(elapsed => new Tick(elapsed)))
  const keyObservable = <T>(e: KeyEvent, k: Key, result: T) =>
    fromEvent<KeyboardEvent>(document, e).pipe(
      filter(({ code }) => code === k), // get the required code
      filter(({ repeat }) => !repeat), // make sure it is not repeated
      map(() => result) // Action taken is being returned
    )
  const startLeftMove = keyObservable('keydown', 'ArrowLeft', new Move(-1.5)) // pressing left arrow key will create left movement
  const startRightMove = keyObservable('keydown', 'ArrowRight', new Move(1.5)) //pressing right arrow key will create right movement
  const stopLeftMove = keyObservable('keyup', 'ArrowLeft', new Move(0)) // releasing left arrow key will stop left movement
  const stopRightMove = keyObservable('keyup', 'ArrowRight', new Move(0)) // releasing right arrow key will stop right movement
  const shoot = keyObservable('keydown', 'Space', new Shoot()) // pressing space will create shoot action

  const asp = settings.alienSpeed
  const alienMove = merge(
    interval(10).pipe(map(() => new AlienMove(Vec.Zero))), // override alien vel to zero
    interval(1000 / asp).pipe(
      scan(acc => acc + 1, 0), // occurence will keep + 1
      scan((acc, curr) => {
        if (curr % 5 === 0) return new Vec(0, 10) // move downwards every 5 occurences
        if (acc.y === 10)
          // last digit = 1, 2, 3, 4 move right, 6, 7, 8, 9 move left
          return lastDigit(curr) >= 6 ? new Vec(-10, 0) : new Vec(10, 0)
        return new Vec(acc.x, 0)
      }, new Vec(10, 0)), // move x axis for 10 units
      map(vec => new AlienMove(vec)) // create alien movement
    )
  )
  const alienShoot = interval(1000).pipe(map(() => new AlienShoot())) // alien shoot bullets every 1 second
  // drop a life in a random time interval of 10 - 14 seconds
  const addLife = interval((randInt(rng)(5) + 10) * 1000).pipe(
    map(() => new Vec(100 + randInt(rng)(400), 200)), // life will drop at a random x axis > 100
    map(vec => new AddLife(vec))
  )

  // Aliens, hearts, shields and bullets are objects
  const createObject =
    (viewType: ViewType) =>
    (size: Size) =>
    (oid: ObjectId) =>
    (obj: Obj) =>
    (vel: Vec) => {
      return {
        ...oid,
        ...obj,
        ...size,
        vel: vel,
        id: viewType + oid.id,
        viewType: viewType,
      } as Bod
    }

  // create alien
  const createAlien = createObject('alien')({
    width: Constants.AlienWidth,
    height: Constants.AlienHeight,
  })

  // create bullet by looking at bullet type (alien bullet or spaceship bullet)
  const createBullet = (bulletType: BulletView) =>
    createObject(bulletType)({
      width: Constants.BulletWidth,
      height: Constants.BulletHeight,
    })

  // create shield
  const createShield = createObject('shield')({
    width: Constants.ShieldWidth,
    height: Constants.ShieldHeight,
  })

  // create heart
  const createHeart = createObject('heart')({
    width: Constants.HeartWidth,
    height: Constants.HeartHeight,
  })

  // create a spaceship
  const createSpaceship = (): Bod => ({
    id: 'spaceship',
    viewType: 'spaceship',
    pos: new Vec(Constants.SpaceshipStartX, Constants.SpaceshipStartY),
    width: Constants.SpaceshipWidth,
    height: Constants.SpaceshipHeight,
    vel: Vec.Zero,
    createTime: 0,
  })

  // create a list for aliens with their positions respectively
  // create array of alien starting with x axis of 40, array size of 10 and spaces of x axis between each alien will be 50
  const aX = arr(10)(50)(40)
  // create array of alien starting with y axis of 20, array size of 5 and spaces of y axis between each alien will be 50
  const aY = arr(5)(50)(20)
  // merge aX and aY together to get a flat array consisting 50 aliens with their respective positions.
  const posAliens = flatMap(aY, y => aX.map<[number, number]>(x => [x, y]))

  // create alien by passing in their positions
  const startAliens = [...Array(Constants.StartAliensCount)].map((_, i) =>
    createAlien({ id: i.toString(), createTime: Constants.StartTime })({
      pos: new Vec(posAliens[i][0], posAliens[i][1]), // get the position based on id
    })(Vec.Zero)
  )

  // create array of shields (5 stacks of shields will be created)
  const sX: number[] = [...Array(5)]
    .reduce((acc: number[]) => acc.concat(acc[acc.length - 1] + 100), [75]) // [75, 175, 275, ...]
    .map((start: number) => arr(5)(10)(start)) // [[75, 85, 95, 105, 115], [175, 185, 195, ...]]
    .flat() // [75, 85, 95, 105, 115, 175, 185, ...]
  // create array of shields starting with y axis of 400, array size of 3 and spaces of y axis between each shield will be 10
  const sY = arr(3)(10)(400)
  // merge sX and sY together to get a flat array consisting 75 small shields with their respective positions.
  const posShields = flatMap(sX, x => sY.map<[number, number]>(y => [x, y]))
  const startShields = [...Array(Constants.StartShieldsCount)].map((_, i) =>
    createShield({
      id: (Constants.StartAliensCount + i).toString(),
      createTime: Constants.StartTime,
    })({
      pos: new Vec(posShields[i][0], posShields[i][1]), // get the position based on id
    })(Vec.Zero)
  )

  // Initial state of the game
  const initialState: State = {
    time: 0,
    spaceship: createSpaceship(), // spaceship will be created immediately
    bullets: [],
    alienBullets: [],
    shields: startShields,
    aliens: startAliens,
    exit: [],
    objCount: Constants.StartAliensCount + Constants.StartShieldsCount, // for bullets id
    gameOver: false,
    score: settings.score,
    highscore: settings.highscore,
    level: settings.level,
    alienSpeed: settings.alienSpeed,
    hearts: [],
    life: settings.life,
    nextLevel: false,
  }

  // wrap a positions for width and height of canvas
  const edgeWrap = ({ x, y }: Vec, o: Bod) => {
    const s = Constants.CanvasSize
    const wrap = (v: number, offset: number) =>
      // objects cannot move exceed width of canvas
      // objects can exceed height of canvas
      // by comparing object width, canvas size and current position
      v < 0 ? 0 : v + offset > s ? s - offset : v
    return new Vec(wrap(x, o.width), wrap(y, 0))
  }

  // all movement comes through here
  const moveBody = (o: Bod): Bod => ({
    ...o,
    pos: edgeWrap(o.pos.add(o.vel), o),
  })

  // alien shooting is handle here
  const handleAlienShoot = (s: State): State => {
    if (!s.aliens.length) return s // if all aliens are killed

    const i = randInt(rng)(s.aliens.length)
    const alien = s.aliens[i] // generate a random alien to shoot in the range of array size

    return {
      ...s,
      alienBullets: s.alienBullets.concat(
        createBullet('alienBullet')({
          // when shoot, bullets will be created
          id: s.objCount.toString(),
          createTime: s.time,
        })({
          pos: alien.pos.add(new Vec(12, 30)), // bullets shot from mid bottom of alien
        })(new Vec(0, Constants.BulletVelocity))
      ),
      objCount: s.objCount + 1, // bullets id increment by 1
    }
  }

  // check a State for collisions:
  //   bullets destroy aliens
  //   alien bullets destroy shields
  //   aliens destroy shields, shields destroy aliens
  // cited from asteroid05
  const handleCollisions = (s: State): State => {
    // returns true if 2 bodies are collided
    const bodiesCollided = ([a, b]: [Bod, Bod]) => isCollided(a, b)
    // cited from asteroid05
    const cut = except((a: Bod) => (b: Bod) => a.id === b.id)
    // this will ensure body with same id does not appear more than once
    // to avoid error when removing element in svg in the update view function
    const norepeat = (arr: Bod[]) =>
      arr.reduce(
        (acc, curr) =>
          acc.some(a => a.id === curr.id) ? acc : acc.concat(curr), // only concat if current body is not in array
        [] as Bod[]
      )

    // collision of ship
    const collidedBulletsWSpaceship = s.alienBullets.filter(r =>
      bodiesCollided([s.spaceship, r])
    )
    const shipCollided =
      s.aliens.filter(r => bodiesCollided([s.spaceship, r])).length > 0 || // if aliens collided with spaceship
      collidedBulletsWSpaceship.length > 0 // if alien bullet collided with spaceship

    // if alien reach the position below space ship
    const alienReachedBottom = s.aliens.some(
      a => a.pos.y + a.height >= Constants.SpaceshipStartY
    )

    // check collision between alien and bullet first
    // create an array to merge aliens and bullets
    const allBulletsAndAliens = flatMap(s.bullets, b =>
      s.aliens.map<[Bod, Bod]>(a => [b, a])
    )
    // if aliens collided with bullets
    const collidedBulletsAndAliens = allBulletsAndAliens.filter(bodiesCollided)
    // this is to seperate collided bullets and aliens
    const collidedBulletsWAlien = collidedBulletsAndAliens.map(
      ([bullet, _]) => bullet
    )
    const collidedAliensWBullet = collidedBulletsAndAliens.map(
      ([_, alien]) => alien
    )

    // check collision between shield and bullet
    // both alien bullets and spaceship bullets will collide with shield
    // create an array to merge shields, spaceship bullets and aliens bullets
    const allBulletsAndShields = flatMap([...s.bullets, ...s.alienBullets], b =>
      s.shields.map<[Bod, Bod]>(s => [b, s])
    )
    // if bullets collided with shields
    const collidedBulletsAndShields =
      allBulletsAndShields.filter(bodiesCollided)
    // this is to seperate collided bullets and shields
    const collidedAlienBulletsWShield = collidedBulletsAndShields
      .map(([bullet, _]) => bullet)
      .filter(b => b.viewType === 'alienBullet')
    const collidedBulletsWShield = collidedBulletsAndShields
      .map(([bullet, _]) => bullet)
      .filter(b => b.viewType === 'bullet')
    const collidedShieldsWBullet = collidedBulletsAndShields.map(
      ([_, shield]) => shield
    )

    // check collision between alien and shield
    const allAliensAndShields = flatMap(s.aliens, a =>
      s.shields.map<[Bod, Bod]>(s => [a, s])
    )
    // if aliens collided with shields
    const collidedAliensAndShields = allAliensAndShields.filter(bodiesCollided)
    // this is to seperate collided aliens and shields
    const collidedAliensWShield = collidedAliensAndShields.map(([a, _s]) => a)
    const collidedShieldsWAlien = collidedAliensAndShields.map(([_a, s]) => s)

    // This is to avoid repetitions
    const collidedBullets = norepeat([
      ...collidedBulletsWAlien,
      ...collidedBulletsWShield,
    ])
    const collidedAliens = norepeat([
      ...collidedAliensWBullet,
      ...collidedAliensWShield,
    ])
    const collidedShields = norepeat([
      ...collidedShieldsWBullet,
      ...collidedShieldsWAlien,
    ])
    const collidedAlienBullets = norepeat([
      ...collidedBulletsWSpaceship,
      ...collidedAlienBulletsWShield,
    ])

    // collision of heart with ship
    const collidedHearts = s.hearts.filter(h =>
      bodiesCollided([s.spaceship, h])
    )

    const score = s.score + collidedAliensWBullet.length // update score by adding length of collision of aliens and space ship
    const increasedLife = collidedHearts.length ? 1 : 0 // add one life if spaceship collided with heart
    const decreaseLife = shipCollided || alienReachedBottom ? -1 : 0 // ship colliding with alien or alien bullet deduct one life
    const life = s.life + increasedLife + decreaseLife
    const gameOver = life <= 0 // game over when no more life

    const remainingAliens = cut(s.aliens)(collidedAliens) // return aliens that not yet been collided
    const nextLevel = !remainingAliens.length // if no remaining aliens, proceed to next level

    return {
      ...s,
      bullets: cut(s.bullets)(collidedBullets), // return bullets that not yet been collided
      alienBullets: cut(s.alienBullets)(collidedAlienBullets), // return alienBullets that not yet been collided
      aliens: remainingAliens, // return aliens that not yet been collided
      shields: cut(s.shields)(collidedShields), // return shields that not yet been collided
      hearts: cut(s.hearts)(collidedHearts), // return hearts that not yet been collided
      exit: s.exit.concat(
        collidedBullets,
        collidedAlienBullets,
        collidedAliens,
        collidedShields,
        collidedHearts
      ),
      life: life,
      gameOver: gameOver,
      score: score,
      // if gameover, check if current game has new highscore, if true then update highscore
      highscore: gameOver
        ? score > s.highscore
          ? score
          : s.highscore
        : s.highscore,
      // if no remaining aliens, proceed to next level
      level: nextLevel ? s.level + 1 : s.level,
      alienSpeed: nextLevel ? s.alienSpeed + 0.2 : s.alienSpeed, // alien speed will increased
      nextLevel: nextLevel,
    }
  }

  // interval tick: bullet, alien bullets and hearts expired when expiry time reached
  // cited from asteroid05
  const tick = (s: State, elapsed: number) => {
    const expired = (b: Bod) => elapsed - b.createTime > Constants.BulletExpired
    const expiredBullets = s.bullets.filter(expired)
    const activeBullets = s.bullets.filter(not(expired))
    const expiredAlienBullets = s.alienBullets.filter(expired)
    const activeAlienBullets = s.alienBullets.filter(not(expired))
    const expiredHearts = s.hearts.filter(expired)
    const activeHearts = s.hearts.filter(not(expired))

    // move the object
    return handleCollisions({
      ...s,
      spaceship: moveBody(s.spaceship),
      bullets: activeBullets.map(moveBody),
      alienBullets: activeAlienBullets.map(moveBody),
      aliens: s.aliens.map(moveBody),
      hearts: activeHearts.map(moveBody),
      exit: [...expiredBullets, ...expiredAlienBullets, ...expiredHearts],
      time: elapsed,
    })
  }

  // state transducer
  // cited from asteroid05
  const reduceState = (
    s: State,
    e: Move | Tick | Shoot | AlienMove | AlienShoot | AddLife
  ): State =>
    // handle spaceship movement (left or right)
    e instanceof Move
      ? {
          ...s,
          spaceship: {
            ...s.spaceship,
            vel: new Vec(e.direction, 0),
          },
        }
      : // handle spaceship shooting action
      e instanceof Shoot
      ? {
          ...s,
          bullets: s.bullets.concat(
            createBullet('bullet')({
              id: s.objCount.toString(),
              createTime: s.time,
            })({
              pos: s.spaceship.pos.add(new Vec(15, -15)), // bullets will shoot at the middle above body of space ship
            })(new Vec(0, -Constants.BulletVelocity)) // bullets will shoot upwards
          ),
          objCount: s.objCount + 1,
        }
      : // handle movement of alien
      e instanceof AlienMove
      ? {
          ...s,
          aliens: s.aliens.map(a => ({ ...a, vel: e.vel })),
        }
      : // handle alien shooting action
      e instanceof AlienShoot
      ? handleAlienShoot(s)
      : // handle dropping of life
      e instanceof AddLife
      ? {
          ...s,
          hearts: s.hearts.concat(
            createHeart({
              id: s.objCount.toString(),
              createTime: s.time,
            })({ pos: e.pos })(new Vec(0, Constants.HeartVelocity)) // hearts will shoot downwards
          ),
        }
      : tick(s, e.elapsed)

  // main game stream
  const subscription = merge(
    gameClock,
    startLeftMove,
    startRightMove,
    stopLeftMove,
    stopRightMove,
    shoot,
    alienMove,
    alienShoot,
    addLife
  )
    // update view for every state
    .pipe(scan(reduceState, initialState))
    .subscribe(s => {
      updateView(s)
      if (s.nextLevel) {
        nextLevel(s)
      }
    })

  // Update the svg scene.
  // This is an impure function
  // cited from asteroid05
  function updateView(s: State) {
    const svg = document.getElementById('canvas')!
    const spaceship = document.getElementById('spaceship')!
    const score = document.getElementById('score')!
    const highscore = document.getElementById('highscore')!
    const level = document.getElementById('level')!
    const life = document.getElementById('life')!

    // update body view for every objects
    const updateBodyView = (b: Bod) => {
      const createBodyView = () => {
        const g = document.createElementNS(svg.namespaceURI, 'g')
        const image = document.createElementNS(svg.namespaceURI, 'image')
        attr(image, {
          href: href(b.viewType),
          width: b.width.toString(),
          height: b.height.toString(),
        })
        attr(g, {
          id: b.id,
          class: b.viewType,
        })
        g.appendChild(image)
        svg.appendChild(g)
        return g
      }
      const g = document.getElementById(b.id) || createBodyView()
      attr(g, { transform: `translate(${b.pos.x},${b.pos.y})` }) // update body view to their position
    }

    attr(spaceship, {
      transform: `translate(${s.spaceship.pos.x},${s.spaceship.pos.y})`,
    })

    // update body view for every objects
    // use of forEach is impure
    s.bullets.forEach(updateBodyView)
    s.alienBullets.forEach(updateBodyView)
    s.aliens.forEach(updateBodyView)
    s.shields.forEach(updateBodyView)
    s.hearts.forEach(updateBodyView)

    // cited from asteroid05
    s.exit
      .map(o => document.getElementById(o.id))
      .filter(isNotNullOrUndefined)
      .forEach(v => {
        try {
          svg.removeChild(v)
        } catch (e) {
          // rarely it can happen that a bullet can be in exit
          // for both expiring and colliding in the same tick,
          // which will cause this exception
          // This is impure due to use of console.log
          console.log('Already removed:', v.id)
        }
      })

    // update display
    score.textContent = s.score.toString()
    level.textContent = s.level.toString()
    highscore.textContent = s.highscore.toString()
    life.textContent = s.life.toString()

    // set visibility of gameover view in svg
    const gameover = document.getElementById('gameover')!
    if (s.gameOver) {
      subscription.unsubscribe() // stop subscription
      gameover.style.visibility = 'visible' // only visible during gameover time
      menu(s)
    } else {
      gameover.style.visibility = 'hidden'
    }
  }

  // handle next level when all aliens are killed
  // This is an impure function due to calling of clearSVGContent
  function nextLevel(s: State) {
    subscription.unsubscribe() // stop subscription
    clearSVGContent() // impure
    spaceinvaders({
      score: s.score,
      highscore: s.highscore,
      alienSpeed: s.alienSpeed,
      level: s.level,
      life: s.life,
    })
  }
}

/**
 * This function is a menu bar for user to click and start playing
 * This is an impure function due to calling of clearSVGContent
 * @param s state of the game
 */
function menu(s?: State) {
  const btnStart = document.getElementById('btn-start')!
  btnStart.style.visibility = 'visible'

  const subscription = fromEvent<MouseEvent>(btnStart, 'click').subscribe(
    () => {
      btnStart.style.visibility = 'hidden' // once clicked, button becomes not visible
      clearSVGContent() // impure
      const initialSettings = {
        score: 0,
        highscore: 0,
        alienSpeed: 1,
        level: 1,
        life: 1,
      }
      // check if previous game is played
      spaceinvaders(
        s ? { ...initialSettings, highscore: s.highscore } : initialSettings
      )
      subscription.unsubscribe()
    }
  )
}

/**
 * This function will remove svg content
 * This is an impure function
 */
function clearSVGContent() {
  const svg = document.getElementById('canvas')!
  // remove any bullets from last round
  // impure as it will modify DOM and use of forEach
  svg.querySelectorAll('.bullet').forEach(b => b.remove())
  svg.querySelectorAll('.alienBullet').forEach(b => b.remove())
  // remove any hearts from last round
  svg.querySelectorAll('.heart').forEach(b => b.remove())
}

// the following simply runs your pong function on window load. Make sure to leave it in place.
if (typeof window != 'undefined')
  window.onload = () => {
    menu()
  }
