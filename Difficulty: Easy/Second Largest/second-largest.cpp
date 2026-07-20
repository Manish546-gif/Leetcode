class Solution {
  public:
    int getsecond(vector<int> &nums){
        sort(nums.begin(), nums.end());
        
        for(int i = nums.size()-1; i>=1 ; i--){
            if(nums[i] != nums[i-1]){
                return nums[i-1];
            }
        }
        return -1;
    }
    int getSecondLargest(vector<int> &arr) {
        // code here
        int second = getsecond(arr);
        return second;
        
    }
};