class Solution {
public:
   bool isValid(vector<int>& arr, int mid, int k){
    int sum = 0; 
    int count = 0;
    for(int num : arr){
        if(sum + num > mid){
            count++;
            sum = num;
        }
        else{
            sum += num;
        }
    }
    return count<k;
   }
    int splitArray(vector<int>& nums, int k) {
         int left = *max_element(nums.begin(), nums.end());
         int right = accumulate(nums.begin(), nums.end(),0);
         int ans  = right;
         while(left<=right){
            int mid = left + (right-left)/2;
            if(isValid(nums, mid, k)){
                right = mid - 1;
                ans  = mid;
            }
            else{
                left = mid+1;
            }
         }
         return ans;
    }
};