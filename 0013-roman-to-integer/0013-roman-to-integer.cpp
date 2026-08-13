class Solution {
public:
    int romanToInt(string s) {
        unordered_map<char, int> m = {
            {'I', 1}, {'V', 5}, {'X', 10},
            {'L', 50}, {'C', 100}, {'D', 500}, {'M', 1000}
        };
        
        int total = 0;
        int n = s.length();
        
        for (int i = 0; i < n; i++) {
            // If the current value is less than the next character's value, subtract it
            if (i + 1 < n && m[s[i]] < m[s[i + 1]]) {
                total -= m[s[i]];
            } else {
                total += m[s[i]];
            }
        }
        
        return total;
    }
};