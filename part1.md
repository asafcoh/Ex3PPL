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

(b) False – False – the argument type mismatches the function's input type: f expects an argument of type T2, but x is of type T1. Therefore, unless T1 = T2, this typing judgment is invalid. Since we have no guarantee that T1 = T2, the expression is not well-typed.


---

To construct a chain of type variables of length 5, where each variable points to the next via its content field (boxed), we create the following:

Let f: () → number  
Let g: (f) → f  
Let h: (g) → g  
Let i: (h) → h  
Let j: (i) → i  


This results in the desired chain:  
j -> i -> h -> g -> f -> f(number)
