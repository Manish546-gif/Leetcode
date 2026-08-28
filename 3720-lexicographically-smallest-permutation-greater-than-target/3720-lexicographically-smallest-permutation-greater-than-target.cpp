class Solution {
public:
    string lexGreaterPermutation(string s, string target) {
        int n = s.length();
        vector<int> count(26, 0);
        for (char c : s) count[c - 'a']++;

        for (int i = n - 1; i >= 0; i--) {
            vector<int> freq = count;
            bool possible = true;
            for (int j = 0; j < i; j++) {
                if (--freq[target[j] - 'a'] < 0) {
                    possible = false;
                    break;
                }
            }
            if (!possible) continue;

            for (int c = target[i] - 'a' + 1; c < 26; c++) {
                if (freq[c] > 0) {
                    string ans = target.substr(0, i);
                    ans += (char)('a' + c);
                    freq[c]--;

                    for (int k = 0; k < 26; k++) {
                        ans.append(freq[k], 'a' + k);
                    }
                    return ans;
                }
            }
        }

        return "";
    }
};