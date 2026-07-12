class Solution {
public:
bool isValid(vector<int>& arr, int h, int mid){
    int count = 0;
    for(int i = 0; i<arr.size() ; i++){
        // ceil division agar is element ko divide karke uske answer ko uske nearest greater element ko lena ho toh.
         count += (arr[i] + mid - 1) / mid; 
    }
    return count<=h;
}
    int smallestDivisor(vector<int>& nums, int threshold) {
        int left = 1;
        int right = *max_element(nums.begin(), nums.end());
        int ans = right;
        while(left<= right){
            int mid = left +(right-left)/2;

            if(isValid(nums, threshold,mid)){
                ans=mid;
                right=mid-1;
            }
            else{
                left = mid+1;
            }
        }
        return ans;
    }
};