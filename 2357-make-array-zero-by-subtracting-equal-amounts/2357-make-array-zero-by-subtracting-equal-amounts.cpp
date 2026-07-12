class Solution {
public:
    int minimumOperations(vector<int>& nums) {
        vector<int> arr(101,0);
        for(int i =0; i<nums.size();i++){
            if(nums[i] != 0){
                arr[nums[i]]++;
            }
        }
        int ans=0;
        for(int i = 0; i <arr.size(); i++){
            if(arr[i]>0){
                ans++;
            }
        }
        return ans;
    }
};