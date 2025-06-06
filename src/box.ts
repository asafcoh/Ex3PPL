// box.ts

export type Box<T> = { contents: T };

export const makeBox = <T>(x: T): Box<T> => ({ contents: x });

export const unbox = <T>(b: Box<T>): T => b.contents;

export const setBox = <T>(b: Box<T>, x: T): void => { b.contents = x; };
