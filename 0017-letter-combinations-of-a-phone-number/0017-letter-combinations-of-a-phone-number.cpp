class Solution {
public:
    vector<string> letterCombinations(string digits) {

        unordered_map<char, string> data = {
            {'2', "abc"},
            {'3', "def"},
            {'4', "ghi"},
            {'5', "jkl"},
            {'6', "mno"},
            {'7', "pqrs"},
            {'8', "tuv"},
            {'9', "wxyz"},
        };

        if (digits.empty()) return {};

        vector<string> ans;

       for (char x : data[digits[0]]) {
            ans.push_back(string(1, x));
        }

        if (digits.length() == 1)
            return ans;

        for (int i = 1; i < digits.length(); i++) {

            vector<string> replica = ans;
            ans.clear();

            for (int j = 0; j < replica.size(); j++) {
                for (char ch : data[digits[i]]) {
                    ans.push_back(replica[j] + ch);
                }
            }
        }

        return ans;
    }
};