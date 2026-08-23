class Solution {
public:
    vector<vector<int>> findDisappearedNumbers(vector<int>& nums, int lower, int upper) {
        vector<vector<int>> v;
        sort(nums.begin(), nums.end());
        int j = 0;
        while (lower <= upper) {
            while (j < nums.size() && nums[j] < lower) {
                j++;
            }
            if (j == nums.size() || nums[j] > upper) {
                v.push_back({lower, upper});
                break;
            }
            if (lower < nums[j]) {
                v.push_back({lower, nums[j] - 1});
            }
            lower = nums[j] + 1;
            j++;
        }
        
        return v;
    }
};