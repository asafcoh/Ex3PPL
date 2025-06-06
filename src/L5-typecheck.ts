import { equivalentTEs, unparseTExp, makeVoidTExp, TExp } from "./TExp";
import { bind, isFailure, makeFailure, makeOk, Result,bindAll } from "./result";
import { TEnv, applyTEnv, extendTEnv, makeEmptyTEnv } from "./TEnv";
import {
    isNumExp, isBoolExp, isStrExp, isVarRef,
    isDefineExp, isExp, isProgram,
    isAppExp, isIfExp, isProcExp, isLetExp, isLetrecExp, isLitExp,
    parseL5Exp, Exp, CExp, DefineExp, Program,isPrimOp
} from "./L5-ast";


const typeofPrimApp = (op: string, rands: CExp[], tenv: TEnv): Result<TExp> => {
    const numOps = ["+", "-", "*", "/"];
    const boolOps = ["and", "or"];
    const compOps = ["=", "<", ">", "<=", ">="];

    if (numOps.includes(op)) {
        return bind(
            bindAll(rands.map(r => typeofCExp(r, tenv))),
            (tes) =>
                tes.every(te => te.tag === "NumTExp")
                    ? makeOk({ tag: "NumTExp" })
                    : makeFailure(`Operator ${op} expects numbers`)
        );
    }

    if (boolOps.includes(op)) {
        return bind(
            bindAll(rands.map(r => typeofCExp(r, tenv))),
            (tes) =>
                tes.every(te => te.tag === "BoolTExp")
                    ? makeOk({ tag: "BoolTExp" })
                    : makeFailure(`Operator ${op} expects booleans`)
        );
    }

    if (compOps.includes(op)) {
        return bind(
            bindAll(rands.map(r => typeofCExp(r, tenv))),
            (tes) =>
                tes.every(te => te.tag === "NumTExp")
                    ? makeOk({ tag: "BoolTExp" })
                    : makeFailure(`Operator ${op} expects numbers`)
        );
    }

    if (op === "not") {
        return bind(typeofCExp(rands[0], tenv), (te) =>
            te.tag === "BoolTExp"
                ? makeOk({ tag: "BoolTExp" })
                : makeFailure("Operator 'not' expects boolean")
        );
    }

    if (op === "number?" || op === "boolean?") {
        return makeOk({ tag: "BoolTExp" });
    }

    return makeFailure(`Unknown primitive operator: ${op}`);
};


// === טיפוס ביטוי CExp בלבד ===
export const typeofCExp = (exp: CExp, tenv: TEnv): Result<TExp> => {
    console.log("📥 typeofCExp received:", JSON.stringify(exp, null, 2));

    if (isNumExp(exp)) {
        console.log("➡️ Number expression");
        return makeOk({ tag: "NumTExp" });
    }

    if (isBoolExp(exp)) {
        console.log("➡️ Boolean expression");
        return makeOk({ tag: "BoolTExp" });
    }

    if (isStrExp(exp)) {
        console.log("➡️ String expression");
        return makeOk({ tag: "StrTExp" });
    }

    if (isVarRef(exp)) {
        console.log(`➡️ Variable reference: ${exp.var}`);
        return applyTEnv(tenv, exp.var);
    }

    if (isPrimOp(exp)) {
        console.log(`❌ Invalid direct primitive operator: ${exp.op}`);
        return makeFailure("Cannot type a primitive operator directly");
    }

    if (isIfExp(exp)) {
        console.log("➡️ If expression");
        return bind(typeofCExp(exp.test, tenv), (testTE) =>
            bind(typeofCExp(exp.then, tenv), (thenTE) =>
                bind(typeofCExp(exp.alt, tenv), (altTE) =>
                    equivalentTEs(thenTE, altTE)
                        ? makeOk(thenTE)
                        : makeFailure("Types of then/alt branches do not match")
                )
            )
        );
    }

    if (isAppExp(exp)) {
        console.log("➡️ Application expression");
        if (isPrimOp(exp.rator)) {
            console.log(`➡️ Applying primitive operator: ${exp.rator.op}`);
            return typeofPrimApp(exp.rator.op, exp.rands, tenv);
        }

        return bind(typeofCExp(exp.rator, tenv), (ratorType) => {
            if (ratorType.tag !== "ProcTExp") {
                return makeFailure("Application of non-procedure");
            }
            if (ratorType.paramTEs.length !== exp.rands.length) {
                return makeFailure("Wrong number of arguments");
            }

            return bind(
                bindAll(exp.rands.map((rand, i) =>
                    bind(typeofCExp(rand, tenv), (randTE) =>
                        equivalentTEs(randTE, ratorType.paramTEs[i])
                            ? makeOk(true)
                            : makeFailure("Parameter type mismatch")
                    )
                )),
                () => makeOk(ratorType.returnTE)
            );
        });
    }

    if (isProcExp(exp)) {
        console.log("➡️ Procedure expression");
        const newEnv = exp.args.reduce(
            (env, arg) => extendTEnv(env, arg.var, arg.type),
            tenv
        );

        return bind(
            bindAll(exp.body.map(b => typeofCExp(b, newEnv))),
            () => makeOk(exp.returnTE)
        );
    }

    if (isLetExp(exp)) {
        console.log("➡️ Let expression");
        return bind(bindAll(exp.bindings.map(b => typeofCExp(b.val, tenv))), (bindingTEs) => {
            const newEnv = exp.bindings.reduce((env, b, i) => extendTEnv(env, b.var.var, bindingTEs[i]), tenv);
            return bind(bindAll(exp.body.map(b => typeofCExp(b, newEnv))), (results) =>
                makeOk(results[results.length - 1])
            );
        });
    }

    if (isLetrecExp(exp)) {
        console.log("➡️ Letrec expression");
        const newEnv = exp.bindings.reduce((env, b) => extendTEnv(env, b.var.var, b.var.type), tenv);
        return bind(bindAll(exp.bindings.map(b => typeofCExp(b.val, newEnv))), (valTEs) => {
            for (let i = 0; i < valTEs.length; i++) {
                if (!equivalentTEs(valTEs[i], exp.bindings[i].var.type)) {
                    return makeFailure("Letrec binding type mismatch");
                }
            }
            return bind(bindAll(exp.body.map(b => typeofCExp(b, newEnv))), (results) =>
                makeOk(results[results.length - 1])
            );
        });
    }

    if (isLitExp(exp)) {
        console.log("➡️ Literal expression");
        const val = exp.val;
        if (typeof val === "number") return makeOk({ tag: "LiteralTExp" });
        if (typeof val === "boolean") return makeOk({ tag: "LiteralTExp" });
        if (typeof val === "string") return makeOk({ tag: "LiteralTExp" });
        if (val.tag === "SymbolSExp") return makeOk({ tag: "LiteralTExp" });
        if (val.tag === "EmptySExp") return makeOk({ tag: "LiteralTExp" });
        if (val.tag === "CompoundSExp") {
            return makeOk({
                tag: "PairTExp",
                left: { tag: "LiteralTExp" },
                right: { tag: "LiteralTExp" }
            });
        }
        return makeFailure("Unsupported literal value: " + JSON.stringify(val, null, 2));
    }

    console.log("❗ Unsupported expression in typeofCExp:", exp);
    return makeFailure("Unsupported CExp: " + JSON.stringify(exp, null, 2));
};



// === טיפוס כללי לביטוי Exp (CExp או DefineExp) ===
export const typeofExp = (exp: Exp, tenv: TEnv): Result<TExp> =>
    isDefineExp(exp)
        ? makeFailure("Define expression not allowed here")
        : typeofCExp(exp, tenv);

// === טיפוס לביטוי define — מחזיר את הסביבה החדשה אם הצליח ===
export const typeofDefine = (exp: DefineExp, tenv: TEnv): Result<TEnv> => {
    return bind(typeofCExp(exp.val, tenv), (valType) => {
        const declaredType = exp.var.type;
        return equivalentTEs(valType, declaredType)
            ? makeOk(extendTEnv(tenv, exp.var.var, declaredType))
            : makeFailure(`Type mismatch in define: expected ${unparseTExp(declaredType)}, but got ${unparseTExp(valType)}`);
    });
};

// === טיפוס תוכנית שלמה מסוג (L5 ...) ===
export const typeofProgram = (exp: Program, tenv: TEnv): Result<TExp> => {
    if (exp.exps.length === 0) {
        return makeFailure("Empty program");
    }

    // הפרד בין הגדרות לביטויים
    const defines = exp.exps.filter(isDefineExp) as DefineExp[];
    const exprs = exp.exps.filter((e): e is CExp => !isDefineExp(e));

    // הרחב את הסביבה לפי ההגדרות
    const extendedEnv = defines.reduce(
        (env, def) => extendTEnv(env, def.var.var, def.var.type),
        tenv
    );

    // בדוק שההגדרות תואמות לטיפוס שלהן
    const defsTypeCheck = bindAll(
        defines.map(def =>
            bind(typeofCExp(def.val, extendedEnv), (valTE) =>
                equivalentTEs(valTE, def.var.type)
                    ? makeOk("ok")
                    : makeFailure(`Type mismatch in definition of ${def.var.var}`)
            )
        )
    );

    // אם כולן תקינות, טיפוס לביטויים שבתכנית
    return bind(defsTypeCheck, (_) =>
        bind(
            bindAll(exprs.map(e => typeofCExp(e, extendedEnv))),
            (tes) => makeOk(tes[tes.length - 1])
        )
    );
};


// === טיפוס ביטוי בודד (ללא L5) כולל define — מחזיר void או טיפוס רגיל ===
export const L5typeof = (exp: string): Result<string> =>
    bind(parseL5Exp(exp), (parsed) =>
        isProgram(parsed)
            ? makeFailure("Expected a single expression, got a program")
            : isDefineExp(parsed)
                ? bind(typeofDefine(parsed, makeEmptyTEnv()), (_) => makeOk("void"))
                : bind(typeofExp(parsed, makeEmptyTEnv()), (t) => makeOk(unparseTExp(t)))
    );

// === פונקציה ראשית שמקבלת מחרוזת קלט של קוד ===
export const L5programTypeof = (exp: string): Result<string> => {
    const parsed = parseL5Exp(exp);

    if (isFailure(parsed)) {
        return makeFailure(parsed.message);
    }

    const val = parsed.value;

    if (isProgram(val)) {
        return bind(typeofProgram(val, makeEmptyTEnv()), (t) =>
            makeOk(unparseTExp(t)) // <-- כאן הקסם
        );
    } else if (isExp(val)) {
        return bind(typeofExp(val, makeEmptyTEnv()), (t) =>
            makeOk(unparseTExp(t))
        );
    } else {
        return makeFailure("Parse Error: Not a program or expression");
    }
};


