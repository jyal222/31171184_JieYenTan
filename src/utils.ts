// Utility functions
// cited from Asteroid05

/**
 * apply f to every element of a and return the result in a flat array
 * This function is cited from asteroid05
 * @param a an array
 * @param f a function that produces an array
 */
export function flatMap<T, U>(
  a: ReadonlyArray<T>,
  f: (a: T) => ReadonlyArray<U>
): ReadonlyArray<U> {
  return Array.prototype.concat(...a.map(f))
}

/**
 * Composable not: invert boolean result of given function
 * This function is cited from asteroid05
 * @param f a function returning boolean
 * @param x the value that will be tested with f
 */
export const not =
  <T>(f: (x: T) => boolean) =>
  (x: T) =>
    !f(x)

/**
 * This function will set a number of attributes on an Element at once
 * This function is cited from asteroid05
 * @param ele element
 * @param obj object
 */
export function attr(ele: Element, obj: Object) {
  Object.entries(obj).forEach(([key, value]) => ele.setAttribute(key, value))
}

/**
 * is e an element of a using the eq function to test equality?
 * This function is cited from asteroid05
 * @param eq equality test function for two Ts
 * @param a an array that will be searched
 * @param e an element to search a for
 */
export const elem =
  <T>(eq: (_: T) => (_: T) => boolean) =>
  (a: ReadonlyArray<T>) =>
  (e: T) =>
    a.findIndex(eq(e)) >= 0

/**
 * array a except anything in b
 * This function is cited from asteroid05
 * @param eq equality test function for two Ts
 * @param a array to be filtered
 * @param b array of elements to be filtered out of a
 */
export const except =
  <T>(eq: (_: T) => (_: T) => boolean) =>
  (a: ReadonlyArray<T>) =>
  (b: ReadonlyArray<T>) =>
    a.filter(not(elem(eq)(b)))

/**
 * Type guard for use in filters
 * This function is cited from asteroid05
 * @param input something that might be null or undefined
 */
export function isNotNullOrUndefined<T extends Object>(
  input: null | undefined | T
): input is T {
  return input != null
}

/**
 * This function will return last digit of number
 * @param num the value of input
 */
export function lastDigit(num: number): number {
  return +[...num.toString()].pop()!
}

// This function is cited from Tim's code
export class RNG {
  // LCG using GCC's constants
  m = 0x80000000 // 2**31
  a = 1103515245
  c = 12345
  state: number
  constructor(seed: number) {
    this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1))
  }
  nextInt() {
    this.state = (this.a * this.state + this.c) % this.m
    return this.state
  }
  nextFloat() {
    // returns in range [0,1]
    return this.nextInt() / (this.m - 1)
  }
}

/**
 * This function will randomly generate a number within the range of alien array
 * @param max the length of current alien array
 */
export const randInt = (rng: RNG) => (max: number) =>
  Math.floor(rng.nextFloat() * max)
