class Solution {
public:
    vector<int> applyOperations(vector<int>& nums) {
        int c = 0;
        for(int i =0; i <nums.size()-1; i++){
            if(nums[i] == nums[i+1]){
                nums[i] = nums[i]*2;
                nums[i+1] = 0; 
            }
        }
        for(int i =0; i <nums.size() ; i++){
            if(nums[i] != 0){
                nums[c] = nums[i];
                c++;
            }
        }
        for(int i = c; i<nums.size();i++){
            nums[i] = 0;
        }
        return nums;
    }
};