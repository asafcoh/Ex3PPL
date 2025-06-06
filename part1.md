## Question 1.1

### 1. MGUs
(a)  
T1 = [T3 -> T4]  
T2 = Number  
T5 = [T3 -> T4]

(b) No MGU (Number != Symbol)

(c) T1 = T2

(d) MGU = {} (already equal)

### 2. Typing Judgments

(a) True – valid function chaining

(b) False – mismatched argument: f expects T2 but gets T1

---

To construct a chain of type variables of length 5, where each variable points to the next via its content field (boxed), we create the following:

let tvar5 = makeTVar("TVar5");
let tvar4 = makeTVar("TVar4", makeBox(tvar5));
let tvar3 = makeTVar("TVar3", makeBox(tvar4));
let tvar2 = makeTVar("TVar2", makeBox(tvar3));
let tvar1 = makeTVar("TVar1", makeBox(tvar2));

This results in the desired chain:  
TVar1 -> TVar2 -> TVar3 -> TVar4 -> TVar5
