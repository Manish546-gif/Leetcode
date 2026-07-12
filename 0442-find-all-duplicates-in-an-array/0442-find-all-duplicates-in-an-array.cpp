class Solution {
public:
    vector<int> findDuplicates(vector<int>& nums) {
        vector<int>duplicate;
        
        int i =0;
        while(i<nums.size()){
            int curr = nums[i]-1;
            if(nums[i] != nums[curr]){
                swap(nums[i], nums[curr]);
            }
            else{
                i++;
            }
        }

        for(int  i = 0; i<nums.size();i++){
            if(nums[i] != i+1){
                duplicate.push_back(nums[i]);
            }
        }

        return duplicate;
    }
};