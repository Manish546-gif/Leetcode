<h2><a href="https://www.geeksforgeeks.org/problems/geeks-and-the-string--170645/1">Remove Consecutive Two Same</a></h2><h3>Difficulty Level : Difficulty: Medium</h3><hr><div class="problems_problem_content__Xm_eO" style="--text-color: var(--problem-text-color);"><p><span style="font-size: 18px;">Given a string <strong>s</strong>, repeatedly remove all adjacent <strong>duplicate </strong>character pairs until no such pairs remain. </span></p>
<p><span style="font-size: 18px;">Return the resulting string, or <strong>"-1"</strong>&nbsp;if the string becomes <strong>empty</strong>.</span></p>
<p><span style="font-size: 18px;"><strong>Examples :</strong></span></p>
<pre><span style="font-size: 18px;"><strong style="font-size: 18px;">Input</strong><span style="font-size: 18px;">: s = "aaabbaaccd"
</span><strong style="font-size: 18px;">Output</strong><span style="font-size: 18px;">: "ad"
</span><strong style="font-size: 18px;">Explanation</strong><span style="font-size: 18px;">: 
Remove the adjacent pairs "aa", "bb" and "cc" from "<span style="text-decoration: underline;">aa</span>a<span style="text-decoration: underline;">bbaacc</span>d" =&gt; "ad"  
Therefore, the final resulting string is "ad".</span></span></pre>
<pre><span style="font-size: 18px;"><strong>Input</strong>: s = "aaaa"
<strong>Output</strong>: "-1"
<strong>Explanation</strong>: 
Remove the adjacent pair "aa" from "<span style="text-decoration: underline;">aaaa</span>" =&gt; ""
Since the resulting string becomes empty, return "-1".</span>
</pre></div><br><p><span style=font-size:18px><strong>Topic Tags : </strong><br><code>Stack</code>&nbsp;