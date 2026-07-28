class Solution {
public:
    string smallestPalindrome(string s) {
       int n = s.length();
        if (n == 1) return s;
        string part1 = "";
        string mid = "";

        for (int i = 0; i < n / 2; i++) {
            part1 += s[i];
        }

        sort(part1.begin(), part1.end());

        if (n % 2 == 1)
            mid += s[n / 2];

        string part2 = part1;
        reverse(part2.begin(), part2.end());

        return part1 + mid + part2;
    }
}; 