import { Result, makeOk, makeFailure, bind, isFailure, bindAll } from "./result";
import { TExp } from "./TExp";

// טיפוסי TEnv קיימים
export type TEnv = GlobalEnv | ExtEnv;

export interface GlobalEnv {
    tag: "GlobalEnv";
    vars: string[];
    exps: TExp[];
}

export interface ExtEnv {
    tag: "ExtEnv";
    vars: string[];
    exps: TExp[];
    nextEnv: TEnv;
}

// יצירת סביבה ריקה

export const makeEmptyTEnv = (): GlobalEnv => ({
    tag: "GlobalEnv",
    vars: [
        "+", "-", "*", "/", ">", "<", ">=", "<=", "=", "not", "eq?",
        "number?", "boolean?", "string?", "symbol?", "list?", "pair?"
    ],
    exps: [
        // Arithmetic operators
        { tag: "ProcTExp", paramTEs: [{ tag: "NumTExp" }, { tag: "NumTExp" }], returnTE: { tag: "NumTExp" } },
        { tag: "ProcTExp", paramTEs: [{ tag: "NumTExp" }, { tag: "NumTExp" }], returnTE: { tag: "NumTExp" } },
        { tag: "ProcTExp", paramTEs: [{ tag: "NumTExp" }, { tag: "NumTExp" }], returnTE: { tag: "NumTExp" } },
        { tag: "ProcTExp", paramTEs: [{ tag: "NumTExp" }, { tag: "NumTExp" }], returnTE: { tag: "NumTExp" } },

        // Comparison operators
        { tag: "ProcTExp", paramTEs: [{ tag: "NumTExp" }, { tag: "NumTExp" }], returnTE: { tag: "BoolTExp" } }, // >
        { tag: "ProcTExp", paramTEs: [{ tag: "NumTExp" }, { tag: "NumTExp" }], returnTE: { tag: "BoolTExp" } }, // <
        { tag: "ProcTExp", paramTEs: [{ tag: "NumTExp" }, { tag: "NumTExp" }], returnTE: { tag: "BoolTExp" } }, // >=
        { tag: "ProcTExp", paramTEs: [{ tag: "NumTExp" }, { tag: "NumTExp" }], returnTE: { tag: "BoolTExp" } }, // <=
        { tag: "ProcTExp", paramTEs: [{ tag: "NumTExp" }, { tag: "NumTExp" }], returnTE: { tag: "BoolTExp" } }, // =

        // Logical operator
        { tag: "ProcTExp", paramTEs: [{ tag: "BoolTExp" }], returnTE: { tag: "BoolTExp" } }, // not

        // Equality
        { tag: "ProcTExp", paramTEs: [{ tag: "LiteralTExp" }, { tag: "LiteralTExp" }], returnTE: { tag: "BoolTExp" } }, // eq?

        // Type predicates
        { tag: "ProcTExp", paramTEs: [{ tag: "LiteralTExp" }], returnTE: { tag: "BoolTExp" } }, // number?
        { tag: "ProcTExp", paramTEs: [{ tag: "LiteralTExp" }], returnTE: { tag: "BoolTExp" } }, // boolean?
        { tag: "ProcTExp", paramTEs: [{ tag: "LiteralTExp" }], returnTE: { tag: "BoolTExp" } }, // string?
        { tag: "ProcTExp", paramTEs: [{ tag: "LiteralTExp" }], returnTE: { tag: "BoolTExp" } }, // symbol?
        { tag: "ProcTExp", paramTEs: [{ tag: "LiteralTExp" }], returnTE: { tag: "BoolTExp" } }, // list?
        { tag: "ProcTExp", paramTEs: [{ tag: "LiteralTExp" }], returnTE: { tag: "BoolTExp" } }, // pair?
    ]
});


// פונקציית עזר – החלה של סביבה על משתנה
export const applyTEnv = (tenv: TEnv, v: string): Result<TExp> => {
    if (tenv.tag === "GlobalEnv") {
        const pos = tenv.vars.indexOf(v);
        return pos >= 0 ? makeOk(tenv.exps[pos]) : makeFailure(`Variable ${v} not found`);
    } else {
        const pos = tenv.vars.indexOf(v);
        return pos >= 0
            ? makeOk(tenv.exps[pos])
            : applyTEnv(tenv.nextEnv, v);
    }
};

// יצירת סביבה חדשה על בסיס קיימת
export const makeExtendTEnv = (vars: string[], exps: TExp[], nextEnv: TEnv): ExtEnv => ({
    tag: "ExtEnv",
    vars,
    exps,
    nextEnv
});

// הרחבת סביבה עם משתנה יחיד
export const extendTEnv = (tenv: TEnv, v: string, t: TExp): TEnv =>
    makeExtendTEnv([v], [t], tenv);

