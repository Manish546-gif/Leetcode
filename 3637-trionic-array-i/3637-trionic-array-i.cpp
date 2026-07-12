class Solution {
public:
    bool isTrionic(vector<int>& nums) {
        int i = 1;
        int  n = nums.size();
        while(i<n && nums[i-1] < nums[i]){
            i++;
        }

        if(i==1 || i == n) return false;
        while(i<n && nums[i-1] > nums[i]){
            i++;
        }
        if(i==n) return false;

        while(i<n && nums[i-1] < nums[i]){
            i++;
        }
        return i == n;
    }
};