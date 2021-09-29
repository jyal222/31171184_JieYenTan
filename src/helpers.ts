import { Bod, ViewType } from './models'

/**
 * This function will check if the first object is collided with the second object
 * This funciton is cited online
 * @param a the first object
 * @param b the second object
 */
export function isCollided(a: Bod, b: Bod): boolean {
  return (
    a.pos.x < b.pos.x + b.width &&
    b.pos.x < a.pos.x + a.width &&
    a.pos.y < b.pos.y + b.height &&
    b.pos.y < a.pos.y + a.height
  )
}

/**
 * This function will return an array based on start position, size and spaces
 * @param start number of starting x axis
 * @param len length of the array to be created
 * @param space // spaces between each object
 */
export const arr =
  (len: number) =>
  (space: number) =>
  (start: number): number[] =>
    [...Array(len - 1)].reduce(
      acc => acc.concat(acc[acc.length - 1] + space),
      [start]
    )

/**
 * This function will return the image of view type
 * @param viewType view type of object
 */
export function href(viewType: ViewType) {
  if (viewType === 'bullet') return 'public/bullet.png'
  if (viewType === 'alienBullet') return 'public/alien-bullet.png'
  if (viewType === 'alien') return 'public/alien.png'
  if (viewType === 'spaceship') return 'public/spaceship.png'
  if (viewType === 'shield') return 'public/shield.png'
  if (viewType === 'heart') return 'public/heart.png'
  return 'public/egg.png'
}
