class Solution {
public:
    int maxSubarrayLength(vector<int>& nums, int k) {
        unordered_map<int, int> track;
        int left = 0, ans = 0;

        for (int i = 0; i < nums.size(); i++) {
            track[nums[i]]++;
            while (track[nums[i]] > k) {
                track[nums[left]]--;
                left++;
            }

            ans = max(ans, i - left + 1);
        }

        return ans;
    }
};