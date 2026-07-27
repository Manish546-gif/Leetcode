class Solution {
  public:
    int maxSubarraySum(vector<int>& arr, int k) {
        // code here
      
        int currsum = 0;
        for(int  i= 0 ; i<k ; i++){
            currsum+=arr[i];
        }
        
        int maxsum = currsum;
        
        for(int i = k ;i< arr.size(); i++){
            currsum += arr[i];
            currsum -= arr[i-k];
            maxsum = max(currsum, maxsum);
        }
        
        return maxsum;
    }
};