// L5-typecheck
// ========================================================
import { equals, map, zipWith } from 'ramda';
import { isAppExp, isBoolExp, isDefineExp, isIfExp, isLetrecExp, isLetExp, isNumExp,
         isPrimOp, isProcExp, isProgram, isStrExp, isVarRef, parseL5Exp, unparse,
         AppExp, BoolExp, DefineExp, Exp, IfExp, LetrecExp, LetExp, NumExp,
         Parsed, PrimOp, ProcExp, Program, StrExp,isPairExp,isLitExp,LitExp,parseL5 } from "./L5-ast";
import { applyTEnv, makeEmptyTEnv, makeExtendTEnv, TEnv } from "./TEnv";
import { isProcTExp, makeBoolTExp, makeNumTExp, makeProcTExp, makeStrTExp, makeVoidTExp,
         parseTE, unparseTExp,
         BoolTExp, NumTExp, StrTExp, TExp, VoidTExp,makePairTExp,makeEmptyTExp,makeSymbolTExp,LiteralTExp ,makeLiteralTExp} from "./TExp";
import { isEmpty, allT, first, rest, NonEmptyList, List, isNonEmptyList } from '../shared/list';
import { Result, makeFailure, bind, makeOk, zipWithResult,isFailure } from '../shared/result';
import { parse as p } from "../shared/parser";
import { format } from '../shared/format';
import { isCompoundSExp, isEmptySExp, isSymbolSExp, makeCompoundSExp, makeEmptySExp, makeSymbolSExp, SExpValue, valueToString } from './L5-value';


// Purpose: Check that type expressions are equivalent
// as part of a fully-annotated type check process of exp.
// Return an error if the types are different - true otherwise.
// Exp is only passed for documentation purposes.
const checkEqualType = (te1: TExp, te2: TExp, exp: Exp): Result<true> =>
  equals(te1, te2) ? makeOk(true) :
  bind(unparseTExp(te1), (te1: string) =>
    bind(unparseTExp(te2), (te2: string) =>
        bind(unparse(exp), (exp: string) => 
            makeFailure<true>(`Incompatible types: ${te1} and ${te2} in ${exp}`))));

// Compute the type of L5 AST exps to TE
// ===============================================
// Compute a Typed-L5 AST exp to a Texp on the basis
// of its structure and the annotations it contains.

// Purpose: Compute the type of a concrete fully-typed expression
export const L5typeof = (concreteExp: string): Result<string> =>
    bind(p(concreteExp), (x) =>
        bind(parseL5Exp(x), (e: Exp) => 
            bind(typeofExp(e, makeEmptyTEnv()), unparseTExp)));

export const L5programTypeof = (concreteProgram: string): Result<string> =>
    bind(parseL5(concreteProgram), (p) =>
        bind(typeofProgram(p, makeEmptyTEnv()), unparseTExp));
// Purpose: Compute the type of an expression
// Traverse the AST and check the type according to the exp type.
// We assume that all variables and procedures have been explicitly typed in the program.
export const typeofExp = (exp: Parsed, tenv: TEnv): Result<TExp> =>
    isNumExp(exp) ? makeOk(typeofNum(exp)) :
    isBoolExp(exp) ? makeOk(typeofBool(exp)) :
    isStrExp(exp) ? makeOk(typeofStr(exp)) :
    isPrimOp(exp) ? typeofPrim(exp) :
    isVarRef(exp) ? applyTEnv(tenv, exp.var) :
    isIfExp(exp) ? typeofIf(exp, tenv) :
    isProcExp(exp) ? typeofProc(exp, tenv) :
    isAppExp(exp) ? typeofApp(exp, tenv) :
    isLetExp(exp) ? typeofLet(exp, tenv) :
    isLetrecExp(exp) ? typeofLetrec(exp, tenv) :
    isDefineExp(exp) ? typeofDefine(exp, tenv) :
    isProgram(exp) ? typeofProgram(exp, tenv) :
    isLitExp(exp) ? typeofLitExp(exp) :
    // isPairExp(exp) ? typeofPair(exp, tenv) :

    

    // TODO: isPairExp(exp) isLitExp(exp)
    makeFailure(`Unknown type: ${format(exp)}`);

// Purpose: Compute the type of a sequence of expressions
// Check all the exps in a sequence - return type of last.
// Pre-conditions: exps is not empty.
export const typeofExps = (exps: List<Exp>, tenv: TEnv): Result<TExp> =>
    isNonEmptyList<Exp>(exps) ? 
        isEmpty(rest(exps)) ? typeofExp(first(exps), tenv) :
        bind(typeofExp(first(exps), tenv), _ => typeofExps(rest(exps), tenv)) :
    makeFailure(`Unexpected empty list of expressions`);


// a number literal has type num-te
export const typeofNum = (n: NumExp): NumTExp => makeNumTExp();

// a boolean literal has type bool-te
export const typeofBool = (b: BoolExp): BoolTExp => makeBoolTExp();

// a string literal has type str-te
const typeofStr = (s: StrExp): StrTExp => makeStrTExp();

// primitive ops have known proc-te types
const numOpTExp = parseTE('(number * number -> number)');
const numCompTExp = parseTE('(number * number -> boolean)');
const boolOpTExp = parseTE('(boolean * boolean -> boolean)');

// Todo: cons, car, cdr, list
export const typeofPrim = (p: PrimOp): Result<TExp> =>
    (p.op === '+') ? numOpTExp :
    (p.op === '-') ? numOpTExp :
    (p.op === '*') ? numOpTExp :
    (p.op === '/') ? numOpTExp :
    (p.op === 'and') ? boolOpTExp :
    (p.op === 'or') ? boolOpTExp :
    (p.op === '>') ? numCompTExp :
    (p.op === '<') ? numCompTExp :
    (p.op === '=') ? numCompTExp :
    // Important to use a different signature for each op with a TVar to avoid capture
    (p.op === 'number?') ? parseTE('(T -> boolean)') :
    (p.op === 'boolean?') ? parseTE('(T -> boolean)') :
    (p.op === 'string?') ? parseTE('(T -> boolean)') :
    (p.op === 'list?') ? parseTE('(T -> boolean)') :
    (p.op === 'pair?') ? parseTE('(T -> boolean)') :
    (p.op === 'symbol?') ? parseTE('(T -> boolean)') :
    (p.op === 'not') ? parseTE('(boolean -> boolean)') :
    (p.op === 'eq?') ? parseTE('(T1 * T2 -> boolean)') :
    (p.op === 'string=?') ? parseTE('(T1 * T2 -> boolean)') :
    (p.op === 'display') ? parseTE('(T -> void)') :
    (p.op === 'newline') ? parseTE('(Empty -> void)') :
    (p.op === 'cons') ? parseTE('(T1 * T2 -> (Pair T1 T2))') :
    (p.op === 'car') ? parseTE('((Pair T1 T2) -> T1)') :
    (p.op === 'cdr') ? parseTE('((Pair T1 T2) -> T2)') :

    makeFailure(`Primitive not yet implemented: ${p.op}`);

// Purpose: compute the type of an if-exp
// Typing rule:
//   if type<test>(tenv) = boolean
//      type<then>(tenv) = t1
//      type<else>(tenv) = t1
// then type<(if test then else)>(tenv) = t1
export const typeofIf = (ifExp: IfExp, tenv: TEnv): Result<TExp> => {
    const testTE = typeofExp(ifExp.test, tenv);
    const thenTE = typeofExp(ifExp.then, tenv);
    const altTE = typeofExp(ifExp.alt, tenv);
    const constraint1 = bind(testTE, testTE => checkEqualType(testTE, makeBoolTExp(), ifExp));
    const constraint2 = bind(thenTE, (thenTE: TExp) =>
                            bind(altTE, (altTE: TExp) =>
                                checkEqualType(thenTE, altTE, ifExp)));
    return bind(constraint1, (_c1: true) =>
                bind(constraint2, (_c2: true) =>
                    thenTE));
};

// Purpose: compute the type of a proc-exp
// Typing rule:
// If   type<body>(extend-tenv(x1=t1,...,xn=tn; tenv)) = t
// then type<lambda (x1:t1,...,xn:tn) : t exp)>(tenv) = (t1 * ... * tn -> t)
export const typeofProc = (proc: ProcExp, tenv: TEnv): Result<TExp> => {
    const argsTEs = map((vd) => vd.texp, proc.args);
    const extTEnv = makeExtendTEnv(map((vd) => vd.var, proc.args), argsTEs, tenv);
    const constraint1 = bind(typeofExps(proc.body, extTEnv), (body: TExp) => 
                            checkEqualType(body, proc.returnTE, proc));
    return bind(constraint1, _ => makeOk(makeProcTExp(argsTEs, proc.returnTE)));
};

// Purpose: compute the type of an app-exp
// Typing rule:
// If   type<rator>(tenv) = (t1*..*tn -> t)
//      type<rand1>(tenv) = t1
//      ...
//      type<randn>(tenv) = tn
// then type<(rator rand1...randn)>(tenv) = t
// We also check the correct number of arguments is passed.
export const typeofApp = (app: AppExp, tenv: TEnv): Result<TExp> => {
    // Special case: cons
    if (isPrimOp(app.rator) && app.rator.op === "cons" && app.rands.length === 2) {
        return bind(typeofExp(app.rands[0], tenv), (leftT: TExp) =>
            bind(typeofExp(app.rands[1], tenv), (rightT: TExp) =>
                makeOk(makePairTExp(leftT, rightT))));
    }

    // Special case: car
    if (isPrimOp(app.rator) && app.rator.op === "car" && app.rands.length === 1) {
        return bind(typeofExp(app.rands[0], tenv), (argT: TExp) => {
            if (argT.tag === "PairTExp") {
                return makeOk(argT.leftTE);
            } else {
                return makeFailure(`car expected a pair but got ${argT.tag}`);
            }
        });
    }

    // Special case: cdr
    if (isPrimOp(app.rator) && app.rator.op === "cdr" && app.rands.length === 1) {
        return bind(typeofExp(app.rands[0], tenv), (argT: TExp) => {
            if (argT.tag === "PairTExp") {
                return makeOk(argT.rightTE);
            } else {
                return makeFailure(`cdr expected a pair but got ${argT.tag}`);
            }
        });
    }

    // Regular function application
    return bind(typeofExp(app.rator, tenv), (ratorTE: TExp) => {
        if (!isProcTExp(ratorTE)) {
            return bind(unparseTExp(ratorTE), (rator: string) =>
                bind(unparse(app), (exp: string) =>
                    makeFailure<TExp>(`Application of non-procedure: ${rator} in ${exp}`)));
        }

        if (app.rands.length !== ratorTE.paramTEs.length) {
            return bind(unparse(app), (exp: string) =>
                makeFailure<TExp>(`Wrong parameter numbers passed to proc: ${exp}`));
        }

        const constraints = zipWithResult(
            (rand, trand) =>
                bind(typeofExp(rand, tenv), (typeOfRand: TExp) =>
                    checkEqualType(typeOfRand, trand, app)),
            app.rands,
            ratorTE.paramTEs
        );

        return bind(constraints, _ => makeOk(ratorTE.returnTE));
    });
};



// Purpose: compute the type of a let-exp
// Typing rule:
// If   type<val1>(tenv) = t1
//      ...
//      type<valn>(tenv) = tn
//      type<body>(extend-tenv(var1=t1,..,varn=tn; tenv)) = t
// then type<let ((var1 val1) .. (varn valn)) body>(tenv) = t
export const typeofLet = (exp: LetExp, tenv: TEnv): Result<TExp> => {
    const vars = map((b) => b.var.var, exp.bindings);
    const vals = map((b) => b.val, exp.bindings);
    const varTEs = map((b) => b.var.texp, exp.bindings);
    const constraints = zipWithResult((varTE, val) => bind(typeofExp(val, tenv), (typeOfVal: TExp) => 
                                                            checkEqualType(varTE, typeOfVal, exp)),
                                      varTEs, vals);
    return bind(constraints, _ => typeofExps(exp.body, makeExtendTEnv(vars, varTEs, tenv)));
};

// Purpose: compute the type of a letrec-exp
// We make the same assumption as in L4 that letrec only binds proc values.
// Typing rule:
//   (letrec((p1 (lambda (x11 ... x1n1) body1)) ...) body)
//   tenv-body = extend-tenv(p1=(t11*..*t1n1->t1)....; tenv)
//   tenvi = extend-tenv(xi1=ti1,..,xini=tini; tenv-body)
// If   type<body1>(tenv1) = t1
//      ...
//      type<bodyn>(tenvn) = tn
//      type<body>(tenv-body) = t
// then type<(letrec((p1 (lambda (x11 ... x1n1) body1)) ...) body)>(tenv-body) = t
export const typeofLetrec = (exp: LetrecExp, tenv: TEnv): Result<TExp> => {
    const ps = map((b) => b.var.var, exp.bindings);
    const procs = map((b) => b.val, exp.bindings);
    if (! allT(isProcExp, procs))
        return makeFailure(`letrec - only support binding of procedures - ${format(exp)}`);
    const paramss = map((p) => p.args, procs);
    const bodies = map((p) => p.body, procs);
    const tijs = map((params) => map((p) => p.texp, params), paramss);
    const tis = map((proc) => proc.returnTE, procs);
    const tenvBody = makeExtendTEnv(ps, zipWith((tij, ti) => makeProcTExp(tij, ti), tijs, tis), tenv);
    const tenvIs = zipWith((params, tij) => makeExtendTEnv(map((p) => p.var, params), tij, tenvBody),
                           paramss, tijs);
    const types = zipWithResult((bodyI, tenvI) => typeofExps(bodyI, tenvI), bodies, tenvIs)
    const constraints = bind(types, (types: TExp[]) => 
                            zipWithResult((typeI, ti) => checkEqualType(typeI, ti, exp), types, tis));
    return bind(constraints, _ => typeofExps(exp.body, tenvBody));
};

// Typecheck a full program
// TODO: Thread the TEnv (as in L1)
// export const typeofLitExp = (exp: LitExp): Result<TExp> => {
//     const val = exp.val;
//     if (typeof val === "number") return makeOk(makeNumTExp());
//     if (typeof val === "boolean") return makeOk(makeBoolTExp());
//     if (typeof val === "string") return makeOk(makeStrTExp());
//     if (isEmptySExp(val)) return makeOk(makeEmptyTExp()); // תוכל להגדיר טיפוס מתאים
//     if (isSymbolSExp(val)) return makeOk(makeSymbolTExp());
//     if (isCompoundSExp(val)) {
//         return bind(typeofLitExp({ tag: "LitExp", val: val.val1 }), (t1) =>
//             bind(typeofLitExp({ tag: "LitExp", val: val.val2 }), (t2) =>
//                 makeOk(makePairTExp(t1, t2))));
//     }
//     return makeFailure("Unknown literal type");
// };
export const typeofLitExp = (exp: LitExp): Result<TExp> => {
    const val = exp.val;

    const fix = (v: SExpValue): TExp =>
        (typeof v === "number") ? makeNumTExp() :
        (typeof v === "boolean") ? makeBoolTExp() :
        (typeof v === "string") ? makeStrTExp() :
        (isCompoundSExp(v)) ? makeLiteralTExp() :  // זוגות נטפלים בנפרד
        makeLiteralTExp(); // כל דבר אחר כולל symbol, emptySExp, וכו'

    if (isCompoundSExp(val)) {
        const t1 = fix(val.val1);
        const t2 = fix(val.val2);
        return makeOk(makePairTExp(t1, t2));
    }

    return makeOk(makeLiteralTExp());
};


// export const typeofPair = (exp: AppExp, tenv: TEnv): Result<TExp> =>
//     (exp.rands.length === 2) ?
//         bind(typeofExp(exp.rands[0], tenv), (leftT: TExp) =>
//         bind(typeofExp(exp.rands[1], tenv), (rightT: TExp) =>
//             makeOk(makePairTExp(leftT, rightT)))) :
//         makeFailure(`'cons' expects exactly 2 arguments`);



// Purpose: compute the type of a define
// Typing rule:
//   (define (var : texp) val)
// TODO - write the true definition
export const typeofDefine = (exp: DefineExp, tenv: TEnv): Result<VoidTExp> => {
    // נבדוק את הטיפוס של הביטוי שמשוייך
    const valTE = typeofExp(exp.val, tenv);

    // נבדוק התאמה לטיפוס המוצהר במשתנה
    return bind(valTE, (valT: TExp) =>
        bind(checkEqualType(valT, exp.var.texp, exp), (_check: true) =>
            makeOk(makeVoidTExp())));
};

// Purpose: compute the type of a program
// Typing rule:
// TODO - write the true definition
export const typeofProgram = (exp: Program, tenv: TEnv): Result<TExp> => {
    let currentTEnv = tenv;
    let lastResult: Result<TExp> = makeFailure("Empty program");

    for (const expr of exp.exps) {
        if (isDefineExp(expr)) {
            const valType = typeofExp(expr.val, currentTEnv);
            if (isFailure(valType)) {
                return valType;
            }
            currentTEnv = makeExtendTEnv([expr.var.var], [expr.var.texp], currentTEnv);
            lastResult = makeOk(makeVoidTExp());
        } else {
            lastResult = typeofExp(expr, currentTEnv);
            if (isFailure(lastResult)) {
                return lastResult;
            }
        }
    }

    return lastResult;
};
//L5programTypeof