class Solution {
public:
    bool isValid(vector<int> &arr, int days, int mid){
        int count = 1;   
        int sum = 0;

        for(int i = 0; i < arr.size(); i++){
            if(sum + arr[i] > mid){
                count++;           
                sum = arr[i];
            }
            else{
                sum += arr[i];
            }
        }

        return count <= days;
    }

    int shipWithinDays(vector<int>& weights, int days) {

        int f = *max_element(weights.begin(), weights.end()); 
        int l = accumulate(weights.begin(), weights.end(), 0);
        int ans = -1;

        while(f <= l){
            int mid = f + (l - f) / 2;

            if(isValid(weights, days, mid)){
                ans = mid;
                l = mid - 1;
            }
            else{
                f = mid + 1;
            }
        }
        return ans;
    }
};
