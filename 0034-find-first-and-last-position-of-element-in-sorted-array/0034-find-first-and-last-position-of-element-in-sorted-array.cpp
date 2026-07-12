class Solution {
public:
    vector<int> searchRange(vector<int>& nums, int target) {
        vector<int>pos;
        int left = 0, right = nums.size()-1;
       int ans= -1;
        // to search the first position of the element and than push that element in the array
        while(left<=right){
            int mid = left + (right-left)/2;
            if(nums[mid]==target){
                ans = mid;
                right = mid-1;
            }
            if(target<nums[mid]){
                right = mid-1;
            }
            if(target > nums[mid]){
                left = mid+1;
            }
        }
        pos.push_back(ans);
        ans = -1;
        left = 0, right = nums.size()-1;
         while(left<=right){
            int mid = left + (right-left)/2;
            if(nums[mid]==target){
                ans = mid;
                left = mid+1;
            }
            if(target<nums[mid]){
                right = mid-1;
            }
            if(target > nums[mid]){
                left = mid+1;
            }
        }
        pos.push_back(ans);

        return pos;

    }
};