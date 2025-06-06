// L5 Abstract Syntax Tree (AST) - Complete for Homework 3 (PPL)
// Includes only constructs required for typechecking and define handling
import util from 'util'; // שורת ייבוא למעלה
import { Result, makeOk, makeFailure } from "./result";
import { TExp } from "./TExp";  // ✅ שורת ייבוא טיפוסים תקינה
const p = require("s-expression");

// === Expressions ===
export type Exp = DefineExp | CExp;

export type CExp =
    | NumExp
    | BoolExp
    | StrExp
    | PrimOp
    | VarRef
    | IfExp
    | AppExp
    | ProcExp
    | LetExp
    | LetrecExp
    | LitExp;

// Atomic expressions
export interface NumExp { tag: "NumExp"; val: number; }
export interface BoolExp { tag: "BoolExp"; val: boolean; }
export interface StrExp { tag: "StrExp"; val: string; }
export interface PrimOp { tag: "PrimOp"; op: string; }
export interface VarRef { tag: "VarRef"; var: string; }

// Compound expressions
export interface IfExp {
    tag: "IfExp";
    test: CExp;
    then: CExp;
    alt: CExp;
}

export interface AppExp {
    tag: "AppExp";
    rator: CExp;
    rands: CExp[];
}

export interface ProcExp {
    tag: "ProcExp";
    args: VarDecl[];
    body: CExp[];
    returnTE: TExp;
}

export interface LetExp {
    tag: "LetExp";
    bindings: Binding[];
    body: CExp[];
}

export interface LetrecExp {
    tag: "LetrecExp";
    bindings: Binding[];
    body: CExp[];
}

export interface LitExp {
    tag: "LitExp";
    val: SExp;
}

// === Program ===
export interface Program {
    tag: "Program";
    exps: Exp[];
}

// === Define ===
export interface DefineExp {
    tag: "DefineExp";
    var: VarDecl;
    val: CExp;
}

// === Bindings and Declarations ===
export interface VarDecl {
    tag: "VarDecl";
    var: string;
    type: TExp;
}

export interface Binding {
    tag: "Binding";
    var: VarDecl;
    val: CExp;
}

// === Literals ===
export type SExp = number | boolean | string | SymbolSExp | EmptySExp | CompoundSExp;

export interface SymbolSExp { tag: "SymbolSExp"; val: string; }
export interface EmptySExp { tag: "EmptySExp"; }
export interface CompoundSExp { tag: "CompoundSExp"; val: SExp[]; }

// === Type Guards ===
export const isDefineExp = (x: any): x is DefineExp => x?.tag === "DefineExp";
export const isVarRef = (x: any): x is VarRef => x?.tag === "VarRef";
export const isVarDecl = (x: any): x is VarDecl => x?.tag === "VarDecl";
export const isAppExp = (x: any): x is AppExp => x?.tag === "AppExp";
export const isProcExp = (x: any): x is ProcExp => x?.tag === "ProcExp";
export const isLetExp = (x: any): x is LetExp => x?.tag === "LetExp";
export const isLetrecExp = (x: any): x is LetrecExp => x?.tag === "LetrecExp";
export const isIfExp = (x: any): x is IfExp => x?.tag === "IfExp";
export const isProgram = (x: any): x is Program => x?.tag === "Program";
export const isNumExp = (x: any): x is NumExp => x?.tag === "NumExp";
export const isBoolExp = (x: any): x is BoolExp => x?.tag === "BoolExp";
export const isStrExp = (x: any): x is StrExp => x?.tag === "StrExp";
export const isPrimOp = (x: any): x is PrimOp => x?.tag === "PrimOp";
export const isLitExp = (x: any): x is LitExp => x?.tag === "LitExp";
export const isCExp = (exp: Exp): exp is CExp =>
    isNumExp(exp) || isBoolExp(exp) || isStrExp(exp) || isVarRef(exp) ||
    isIfExp(exp) || isProcExp(exp) || isAppExp(exp) || isLetExp(exp) ||
    isLetrecExp(exp) || isLitExp(exp);

export const isExp = (x: any): x is Exp =>
    isDefineExp(x) || isCExp(x);


// === Constructors for tests ===
export const makeNumExp = (val: number): NumExp => ({ tag: "NumExp", val });
export const makeBoolExp = (val: boolean): BoolExp => ({ tag: "BoolExp", val });
export const makeStrExp = (val: string): StrExp => ({ tag: "StrExp", val });
export const makeVarDecl = (v: string, t: TExp): VarDecl => ({ tag: "VarDecl", var: v, type: t });
export const makeDefineExp = (v: VarDecl, val: CExp): DefineExp => ({ tag: "DefineExp", var: v, val });
export const makeProgram = (exps: Exp[]): Program => ({ tag: "Program", exps });

// === Parser ===
export const parseL5Exp = (src: string): Result<Exp | Program> => {
    try {
        const sexp = p(src);
        console.log("Raw parsed S-expression:", util.inspect(sexp, false, null, true));

        if (Array.isArray(sexp) && sexp[0] === "L5") {
            const exps: Exp[] = sexp.slice(1) as Exp[];
            console.log("Parsed Program AST:", util.inspect(exps, false, null, true));
            return makeOk(makeProgram(exps));
        } else {
            const exp: Exp = sexp as Exp;
            console.log("Parsed Single Expression AST:", util.inspect(exp, false, null, true));
            return makeOk(exp);
        }
    } catch (e) {
        return makeFailure(`Parse error: ${e}`);
    }
};
