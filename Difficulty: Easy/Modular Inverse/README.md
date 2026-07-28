<h2><a href="https://www.geeksforgeeks.org/problems/modular-multiplicative-inverse-1587115620/1">Modular Inverse</a></h2><h3>Difficulty Level : Difficulty: Easy</h3><hr><div class="problems_problem_content__Xm_eO" style="--text-color: var(--problem-text-color);"><p><span style="font-size: 18px;">Given two integers <strong>n</strong> and <strong>m</strong>, return the smallest positive integer <strong>x </strong>such that <strong>(n * x) % m = 1</strong>, i.e., the <strong>modular multiplicative inverse</strong> of n under modulo m. If no such integer exists, return <strong>-1</strong>.</span></p>
<p><span style="font-size: 18px;"><strong>Examples :</strong></span></p>
<pre><span style="font-size: 18px;"><strong>Input: </strong>n = 3, m = 11
<strong>Output: </strong>4
<strong>Explanation: </strong></span><span style="font-size: 14pt;">Since (4 × 3) mod 11 = 1, 4 is the modulo inverse of 3 under mod 11.</span></pre>
<pre><span style="font-size: 18px;"><strong>Input: </strong>n = 10, m = 17
<strong>Output: </strong>12
<strong>Explanation: </strong>Since (12*10) mod 17 = 1, 12 is the modulo inverse of 10.</span></pre>
<p><span style="font-size: 18px;"><strong>Constraints:</strong><br>1 ≤ n ≤ 10<sup>4</sup><br>1 ≤ m ≤ 10<sup>5</sup></span></p></div><br><p><span style=font-size:18px><strong>Topic Tags : </strong><br><code>Mathematical</code>&nbsp;