class Solution {
public:
    int findMaxConsecutiveOnes(vector<int>& nums) {
        int n =  nums.size();
        int count = 0, maxc = 0;
        for(int i = 0; i<n; i++){
            if(nums[i] == 1){
                count++;
            }
            else{
                maxc = max(maxc, count);
                count = 0;
            }
        }
        maxc = max(maxc, count);
        return maxc;
    }
};