class Solution {
public:
     bool isValid(vector<int>& arr, long long int mid, int k){
       long long int count = 0;
        for(int i = 0;i<arr.size(); i++){
            if(arr[i] > mid){
                count += (arr[i] + mid - 1)/mid -1;
            }
        }
        return count<=k;
     }
    int minimumSize(vector<int>& nums, int maxOperations) {
        int left = 1;
        int right = *max_element(nums.begin(), nums.end());
        int ans = right;
        while(left<=right){
           long long int mid = left + (right-left)/2;
            if(isValid(nums, mid, maxOperations)){
                ans = mid;
                right = mid-1;
            }
            else{
                left = mid + 1;
            }
        }
        return ans;
    }
};