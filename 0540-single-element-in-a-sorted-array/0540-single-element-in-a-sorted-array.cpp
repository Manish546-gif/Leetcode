class Solution {
public:
    int singleNonDuplicate(vector<int>& nums) {
        int  left = 0,right = nums.size()-1;
        while(left<right){
           int mid = left +(right-left)/2;
           if(mid & 1 == 1){
            mid = mid -1;
           }
           if(nums[mid] == nums[mid+1]){
            left = mid +2;
           }
           else{
            right = mid;
           }
        }
        return nums[left];
    }
};