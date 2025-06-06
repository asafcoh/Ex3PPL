// src/TExp.ts

// === Type Definitions ===
export type TExp = 
  | NumTExp
  | BoolTExp
  | StrTExp
  | VoidTExp
  | LiteralTExp
  | VarTExp
  | PairTExp
  | ProcTExp;

export type NumTExp = { tag: "NumTExp" };
export type BoolTExp = { tag: "BoolTExp" };
export type StrTExp = { tag: "StrTExp" };
export type VoidTExp = { tag: "VoidTExp" };
export type LiteralTExp = { tag: "LiteralTExp" };
export type VarTExp = { tag: "VarTExp"; var: string };

export type PairTExp = {
  tag: "PairTExp";
  left: TExp;
  right: TExp;
};

export type ProcTExp = {
  tag: "ProcTExp";
  paramTEs: TExp[];
  returnTE: TExp;
};

// === Constructors ===
export const makeNumTExp = (): NumTExp => ({ tag: "NumTExp" });
export const makeBoolTExp = (): BoolTExp => ({ tag: "BoolTExp" });
export const makeStrTExp = (): StrTExp => ({ tag: "StrTExp" });
export const makeVoidTExp = (): TExp => ({ tag: "VoidTExp" });
export const makeLiteralTExp = (): LiteralTExp => ({ tag: "LiteralTExp" });
export const makeVarTExp = (v: string): VarTExp => ({ tag: "VarTExp", var: v });
export const makePairTExp = (left: TExp, right: TExp): PairTExp => ({ tag: "PairTExp", left, right });
export const makeProcTExp = (params: TExp[], ret: TExp): ProcTExp => ({ tag: "ProcTExp", paramTEs: params, returnTE: ret });

// === Type Predicates ===
export const isNumTExp = (x: any): x is NumTExp => x.tag === "NumTExp";
export const isBoolTExp = (x: any): x is BoolTExp => x.tag === "BoolTExp";
export const isStrTExp = (x: any): x is StrTExp => x.tag === "StrTExp";
export const isVoidTExp = (x: any): x is VoidTExp => x.tag === "VoidTExp";
export const isLiteralTExp = (x: any): x is LiteralTExp => x.tag === "LiteralTExp";
export const isVarTExp = (x: any): x is VarTExp => x.tag === "VarTExp";
export const isPairTExp = (x: any): x is PairTExp => x.tag === "PairTExp";
export const isProcTExp = (x: any): x is ProcTExp => x.tag === "ProcTExp";

// === Pretty Print (Optional, if needed) ===
export const unparseTExp = (t: TExp): string => {
  switch (t.tag) {
    case "NumTExp": return "number";
    case "BoolTExp": return "boolean";
    case "StrTExp": return "string";
    case "VoidTExp": return "void";
    case "LiteralTExp": return "literal";
    case "VarTExp": return t.var;
    case "PairTExp": return `(Pair ${unparseTExp(t.left)} ${unparseTExp(t.right)})`;
    case "ProcTExp": return `(${t.paramTEs.map(unparseTExp).join(" * ")} -> ${unparseTExp(t.returnTE)})`;
    default: return "unknown";
  }
};

export const equivalentTEs = (te1: TExp, te2: TExp): boolean => {
  if (isNumTExp(te1) && isNumTExp(te2)) return true;
  if (isBoolTExp(te1) && isBoolTExp(te2)) return true;
  if (isStrTExp(te1) && isStrTExp(te2)) return true;
  if (isVoidTExp(te1) && isVoidTExp(te2)) return true;
  if (isLiteralTExp(te1) && isLiteralTExp(te2)) return true;
  if (isVarTExp(te1) && isVarTExp(te2)) return te1.var === te2.var;
  if (isPairTExp(te1) && isPairTExp(te2))
      return equivalentTEs(te1.left, te2.left) && equivalentTEs(te1.right, te2.right);
  if (isProcTExp(te1) && isProcTExp(te2))
      return te1.paramTEs.length === te2.paramTEs.length &&
          te1.paramTEs.every((te, i) => equivalentTEs(te, te2.paramTEs[i])) &&
          equivalentTEs(te1.returnTE, te2.returnTE);
  return false;
};
