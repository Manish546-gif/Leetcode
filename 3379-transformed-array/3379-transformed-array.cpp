class Solution {
public:
    vector<int> constructTransformedArray(vector<int>& nums) {
        vector<int>ans(nums.size());
        int k;
        int n = nums.size();
        for(int i = 0; i<nums.size();i++){
            k = nums[i];
            int index = (i+k)%n;
             if(index<0)  index +=n;
            ans[i] = nums[index];
        }
        return ans;
    }
};