class Solution {
public:
    vector<int> sequentialDigits(int low, int high) {
        vector<int> ans;

        int lw = log10(low) + 1;
        int hg = log10(high) + 1;

        for (int len = lw; len <= hg; len++) {

            for (int start = 1; start <= 10 - len; start++) {

                int num = 0;
                int digit = start;

                for (int i = 0; i < len; i++) {
                    num = num * 10 + digit;
                    digit++;
                }

                if (num >= low && num <= high) {
                    ans.push_back(num);
                }
            }
        }

        return ans;
    }
};