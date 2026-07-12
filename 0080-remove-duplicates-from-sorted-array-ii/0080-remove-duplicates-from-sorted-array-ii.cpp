class Solution {
public:
    int removeDuplicates(vector<int>& nums) {
        if (nums.size() <= 2) return nums.size(); 

        int c = 2; 
        for (int i = 2; i < nums.size(); i++) {
            if (nums[i] != nums[c - 2]) { 
                nums[c] = nums[i];
                c++;
            }
        }
        return c; 
    }
};