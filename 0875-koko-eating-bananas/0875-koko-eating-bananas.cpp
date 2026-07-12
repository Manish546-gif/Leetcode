class Solution {
public:
    bool isValid(vector<int>& arr, int h, int mid){
        long long count = 0;

        for(int i = 0; i < arr.size(); i++){
            count += (arr[i] + mid - 1) / mid;   

            if(count > h) return false;
        }

        return true;
    }

    int minEatingSpeed(vector<int>& piles, int h) {
        int left = 1;
        int right = *max_element(piles.begin(), piles.end());
        int ans = right;

        while(left <= right){
            int mid = left + (right - left) / 2;

            if(isValid(piles, h, mid)){
                ans = mid;
                right = mid - 1;
            }
            else{
                left = mid + 1;
            }
        }

        return ans;
    }
};
