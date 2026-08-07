class Solution {
public:
    int threeSumClosest(vector<int>& nums, int target) {
        sort(nums.begin(), nums.end());

        int n = nums.size();
        int ans = 0;
        int prev = INT_MAX;

        for (int i = 0; i < n - 2; i++) {
            int j = i + 1;
            int k = n - 1;

            while (j < k) {
                int sum = nums[i] + nums[j] + nums[k];
                int diff = abs(target - sum);

                if (diff < prev) {
                    prev = diff;
                    ans = sum;
                }

                if (sum < target)
                    j++;
                else if (sum > target)
                    k--;
                else
                    return target;   // exact match
            }
        }

        return ans;
    }
};