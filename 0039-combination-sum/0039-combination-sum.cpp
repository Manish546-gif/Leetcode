class Solution {
public:
    void solve(vector<int>& arr, int target , int idx , vector<vector<int>>&ans , vector<int>&temp){
        if(target == 0){
            ans.push_back(temp);
            return ;
        }

        if(idx >= arr.size())
            return;

        for(int i=idx;i<arr.size();i++){
            if(arr[i] <= target){
                temp.push_back(arr[i]);
                solve(arr,target-arr[i],i,ans,temp);
                temp.pop_back();
            }
        }
    }
    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {
        vector<vector<int>>ans ;
        vector<int>temp;

        solve(candidates,target,0,ans,temp);

        return ans;
    }
};