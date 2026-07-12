class Solution {
public:
    int smallestEqual(vector<int>& nums) {
        int ans = -1;
        for(int i = 0 ; i<nums.size();i++){
            if(nums[i] == i%10){
                ans = i;
                break;
            }
        }
        return ans;
    }
};