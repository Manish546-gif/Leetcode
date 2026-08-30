class Solution {
public:
    int minimumDeletions(vector<int>& nums) {
       int mini = *min_element(nums.begin(), nums.end());
        int maxi = *max_element(nums.begin(), nums.end());
        int n = nums.size();

        int idx1 = -1, idx2 = -1;
        for (int i = 0; i < n; i++) {
            if (nums[i] == mini) idx1 = i;
            else if (nums[i] == maxi) idx2 = i;
        }
        int i = min(idx1, idx2);
        int j = max(idx1, idx2);
        return min({j + 1, n - i, (i + 1) + (n - j)});
    }
};