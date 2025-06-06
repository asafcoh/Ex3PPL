// result.ts – כלי עזר לטיפול בהחזרות עם שגיאות

export type Result<T> = Ok<T> | Failure;

export interface Ok<T> {
    tag: "Ok";
    value: T;
}

export interface Failure {
    tag: "Failure";
    message: string;
}

export const makeOk = <T>(val: T): Result<T> => ({ tag: "Ok", value: val });
export const makeFailure = <T = never>(msg: string): Result<T> => ({ tag: "Failure", message: msg });

export const isOk = <T>(r: Result<T>): r is Ok<T> => r.tag === "Ok";
export const isFailure = <T>(r: Result<T>): r is Failure => r.tag === "Failure";

// bind מחיל פונקציה רק אם הערך תקין
export const bind = <T, U>(r: Result<T>, f: (val: T) => Result<U>): Result<U> =>
    isOk(r) ? f(r.value) : r;
export const bindAll = <T>(results: Result<T>[]): Result<T[]> =>
    results.reduce<Result<T[]>>(
        (acc, curr) =>
            isFailure(acc) ? acc :
            isFailure(curr) ? curr :
            makeOk([...acc.value, curr.value]),
        makeOk([] as T[])
    );
