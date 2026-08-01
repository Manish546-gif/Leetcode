class Solution {
public:
     bool solve(vector<int> &nums, int p1, int p2, int left, int right, bool turn) {
        if (left > right)
            return p1 >= p2;

        if (turn) {
            return solve(nums, p1 + nums[left], p2, left + 1, right, false) ||
                   solve(nums, p1 + nums[right], p2, left, right - 1, false);
        } else {
            return solve(nums, p1, p2 + nums[left], left + 1, right, true) &&
                   solve(nums, p1, p2 + nums[right], left, right - 1, true);
        }
    }
    bool predictTheWinner(vector<int>& nums) {
        if(nums.size() == 1 || nums.size() == 2) return true;
        return solve(nums, 0 ,0, 0, nums.size()-1 , true);
    }
};