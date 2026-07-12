class Solution {
public:
    int maximumCount(vector<int>& nums) {
        int pos=0;
        int neg = 0;
        int i =0;
        while(i<nums.size()){
            if(nums[i]<0) neg++;
            else if(nums[i] > 0){
                 pos++;
            } 
            i++;
        }
        return max(pos, neg);
    }
};