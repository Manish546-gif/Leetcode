class Solution {
public:
    int findMaxLength(vector<int>& nums) {
      unordered_map<int, int> mp; 
       mp[0] = -1;
       int sum =0;
       int count = 0;
       for(int i = 0; i<nums.size(); i++){
        if(nums[i] == 0){
            sum += -1;
        }
        else{
            sum += 1;
        }
        if(mp.find(sum) != mp.end()) {
                count = max(count, i - mp[sum]);
            }

            if(mp.find(sum) == mp.end()) {
                mp[sum] = i;
            }
       } 
       return count;
    }
};