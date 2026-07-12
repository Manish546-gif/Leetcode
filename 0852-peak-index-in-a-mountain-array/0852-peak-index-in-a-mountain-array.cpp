class Solution {
public:
    int peakIndexInMountainArray(vector<int>& arr) {
        int ans = 0;
        int left = 0, right= arr.size()-1;
        while(left<right){
            int mid = left + (right-left)/2;
            if(arr[mid] < arr[mid+1]){
                ans = mid+1;
                left = mid+1;
            }
            else{
                ans = mid;
                right = mid;
            }
            
        }
        return ans;
    }
};