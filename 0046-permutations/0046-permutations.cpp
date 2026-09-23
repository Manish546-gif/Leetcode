class Solution {
public:
    void swap(vector<int> &nums, int &i , int &j){
        int temp = nums[i];
        nums[i] = nums[j];
        nums[j] = temp;
    }
     void solve(vector<int> &nums, vector<vector<int>> &ans, int i){
        if(i == nums.size()){
            ans.push_back(nums);
            return;
        }
        for(int j = i; j<nums.size(); j++){
            swap(nums,i,j);
            solve(nums,ans, i+1);
            swap(nums,i,j);
        }
     }
    vector<vector<int>> permute(vector<int>& nums) {
        vector<vector<int>> ans;
        solve(nums,ans,0);
        return ans;
    }
};