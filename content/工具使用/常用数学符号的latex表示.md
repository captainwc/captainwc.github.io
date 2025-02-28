---
title: 常用数学符号的latex表示
date: 2021-02-15
tags: [latex, markdown]
categories: [工具使用]
---



## 常用数学符号

|           符号            | 语法                    |          符号          | 语法                |
| :-----------------------: | ----------------------- | :--------------------: | ------------------- |
|         \(\infty\)          | \infty                  |       \(\vec{s}\)        | \vec{s}             |
|         \(\dot{a}\)         | \dot{a}                 |       \(\ddot{a}\)       | \ddot{a}            |
|       \(\rightarrow\)       | \righrarrow             |     \(\Rightarrow\)      | \Rightarrow         |
|         \(\ldots\)          | \ldots                  |        \(\cdots\)        | \cdots              |
|         \(\vdots\)          | \vdots                  |        \(\ddots\)        | \ddots              |
|          \(\geq\)           | \geq                    |         \(\leq\)         | \leq                |
|          \(\neq\)           | \neq                    |       \(\approx\)        | \approx             |
|         \(\equiv\)          | \equiv                  |         \(\in\)          | \in                 |
|         \(\notin\)          | \notin                  |       \(\subset\)        | \subset             |
|         \(\supset\)         | \supset                 |      \(\subseteq\)       | \subseteq           |
|       \(\subsetneq\)        | \subsetneq              |         \(\cup\)         | \cup                |
|          \(\cap\)           | \cap                    |       \(\bigodot\)       | \bigodot            |
|       \(\bigotimes\)        | \bigotimes              |      \(\emptyset\)       | \emptyset           |
|           \(\R\)            | \R                      |          \(\Z\)          | \Z                  |
|         \(\times\)          | \times                  |         \(\div\)         | \div                |
|           \(\pm\)           | \pm                     |         \(\mp\)          | \mp                 |
|          \(\cdot\)          | \cdot                   |         \(\ast\)         | \ast                |
|    \(\underline{apple}\)    | \underline{apple}       |    \(\overline{x+y}\)    | \overline{x+y}      |
| \(\overbrace{a+b+c}^{3.0}\) | \overbrace{a+b+c}^{3.0} | \(\underbrace{a+b}_{2}\) | \underbrace{a+b}\_2 |
|       \(\mbox{汉字}\)       | \mbox{汉字}             |        \(\prime\)        | \prime              |
|          \(\iint\)          | \iint                   |        \(\iiint\)        | \iiint              |
|          \(\oint\)          | \oint                   |       \(\partial\)       | \partial            |
|     \(\lceil{a}\rceil\)     | \lceil {a} \rceil       |  \(\lfloor{b}\rfloor\)   | \lfloor {b} \rfloor |
|        \(a\quad b\)         | a\quad b                |      \(a\qquad b\)       | a\qquad b           |
|          \(a\;b\)           | a\;b                    |  \(\bigg(\quad \Bigg]\)  | \bigg( \quad \Bigg] |
|   \(\langle{a,b}\rangle\)   | \langle{a,b}\rangle     |                        |                     |

## 常用运算

<b>极限</b>：`\displaystyle \lim_{x_\to \infty}{\frac{3x^2+2}{4x^2+3x+1}}\tag{1}` `\lim`

$$\displaystyle\lim_{x_\to \infty}{\frac{3x^2+2}{4x^2+3x+1}}\tag{1}$$

<b>积分</b>：`\displaystyle \int_{0}^{\pi}{(sinx+cosx)dx}\tag{2}` `\int`

$$\displaystyle\int_{0}^{\pi}{(sinx+cosx)dx}\tag{2}$$

<b>求和</b>：`\displaystyle\sum_{i=0}^n{i^2+i}\tag{3}` `\sum`

$$\displaystyle\sum_{i=0}^n{i^2+i}\tag{3}$$

<b>开方</b>：`\sqrt[3]{x^2+3x}\tag{4}` `\sqrt`

$$\sqrt[3]{x^2+3x}\tag{4}$$

<b>组合</b>：`{n+1\choose k}={n\choose k}+{n\choose k-1}\tag{5}` `\choose`

$${n+1\choose k}={n \choose k}+{n\choose k-1}\tag{5}$$

<b>矩阵</b>：
`\left(\begin{matrix}
&1 &2 &\cdots &5\\
&6 &7 &\cdots &10\\
&\vdots &\vdots &\ddots &\vdots\\
&16 &17 &\cdots &20
\end{matrix}\right)`
`( \begin{matrix}& & &\\& & & \end{martix} )`

$$\left(\begin{matrix}&1&2&\cdots&5\\&6&7&\cdots&10\\&\vdots&\vdots&\ddots&\vdots\\&16&17&\cdots&20\end{matrix}\right)$$

## 希腊字母

> 大写只需将首字母换为大写即可

\alpha \beta \gamma \delta \zeta \eta \theta \epsilon

\kappa \lambda \mu \nu \xi \pi \rho \sigma

\phi \varphi \psi \omega \\varepsilon

$$
\alpha\quad\beta\quad\gamma\quad\delta\quad\zeta\quad\eta\quad\theta\quad\epsilon\\\kappa\quad\lambda\quad\mu\quad\nu\quad\xi\quad\pi\quad\rho\quad\sigma\\
\phi\quad\varphi\quad\psi\quad\omega\quad\varepsilon
$$

$$
\Alpha\quad\Beta\quad\Gamma\quad\Delta\quad\Zeta\quad\Eta\quad\Theta\quad\Epsilon\\\Kappa\quad\Lambda\quad\Mu\quad\Nu\quad\Xi\quad\Pi\quad\Rho\quad\Sigma\\
\Phi\quad\varphi\quad\Psi\quad\Omega\quad\varepsilon
$$
