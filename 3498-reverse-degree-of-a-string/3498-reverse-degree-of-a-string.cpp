class Solution {
public:
    int reverseDegree(string s) {
        int ans = 0;
        for (int i = 0; i < s.length(); i++) {
            int char_val = 'z' - s[i] + 1;
            int pos = i + 1;
            ans += char_val * pos;
        }
        return ans;
    }
};