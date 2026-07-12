class Solution {
public:
    int longestBalanced(vector<int>& nums) {
        int n= nums.size();
        int ans = 0;
        for(int i = 0; i<n;i++){
            unordered_set<int>evenset;
            unordered_set<int>oddset;

            for(int j = i;j<n;j++){
                if(nums[j] % 2 == 0){
                    evenset.insert(nums[j]);
                }
                else{
                    oddset.insert(nums[j]);
                }

                if(evenset.size() == oddset.size()){
                    ans = max(ans, j-i+1);
                }
            }
        }
        return ans;
 
    }
};