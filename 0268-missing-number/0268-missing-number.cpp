class Solution {
public:
    int missingNumber(vector<int>& nums) {
        int total = accumulate(nums.begin(), nums.end(), 0);
        int act = 0;
        for(int i =0; i<=nums.size() ; i++){
            act += i;
        }
        return (act-total);
        
    }
};