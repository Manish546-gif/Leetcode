class Solution {
  public:
    vector<int> rangeSumQueries(vector<int>& arr, vector<vector<int>>& queries) {
        // code here
        vector<int> ans;
        for(int i = 1; i<arr.size() ; i++){
            arr[i] = arr[i] + arr[i-1];
        }
        
        for(int i = 0; i<queries.size(); i++){
            if(queries[i][0] == 0){
                ans.push_back(arr[queries[i][1]]);
                continue;
            }
            ans.push_back(arr[queries[i][1]] - arr[queries[i][0]-1]);
        }
        return ans;
    }
};