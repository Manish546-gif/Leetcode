class Solution {
public:
    bool isValid(vector<int>& arr, int mid, long long k){
        long long count = 0;
        
        for(int i = 0; i < arr.size(); i++){
            count += arr[i] / mid;
        }
        
        return count >= k;
    }

    int maximumCandies(vector<int>& candies, long long k) {
        int left = 1;
        int right = *max_element(candies.begin(), candies.end());
        int ans = 0;

        while(left <= right){
            int mid = left + (right - left) / 2;

            if(isValid(candies, mid, k)){
                ans = mid;
                left = mid + 1;   // bcs we need maximum no of candies so that is why we are using it and trying to find the maximum number
            }
            else{
                right = mid - 1;
            }
        }

        return ans;
    }
};
