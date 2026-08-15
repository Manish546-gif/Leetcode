class Solution {
public:
    int longestSubsequence(vector<int>& nums) {
        int val = 0;
        bool present = false;

        for (int num : nums) {
            val ^= num;
            if (num != 0) {
                present = true;
            }
        }

        if (!present) return 0;
        if (val != 0) return nums.size();
        return nums.size() - 1;
    }
};