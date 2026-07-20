class Solution {
  public:
    int maxSubarraySum(vector<int> &arr) {
        // Code here
         int sum =0, maxsum = INT_MIN;
        for(int i= 0 ; i<arr.size() ; i++){
            sum+=arr[i];
            maxsum = max(sum, maxsum);
            if(sum < 0 ){
                sum =0;
            }
        }
        return maxsum;
    }
};