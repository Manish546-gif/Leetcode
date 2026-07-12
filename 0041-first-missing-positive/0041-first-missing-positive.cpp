class Solution {
public:
    int firstMissingPositive(vector<int>& nums) {
        int i = 0;
        int n = nums.size();

        while(i < n){
            if(nums[i] > 0 && nums[i] <= n){
                int k = nums[i] - 1;

                if(nums[i] != nums[k]){
                    swap(nums[i], nums[k]);
                    continue;
                }
            }
            i++;
        }

        for(int i = 0; i < n; i++){
            if(nums[i] != i + 1){
                return i + 1;
            }
        }

        return n + 1;
    }
};
