class Solution {
public:
    int minimizedMaximum(int n, vector<int>& quantities) {
        int left = 1;
        int right = *max_element(quantities.begin(), quantities.end());
        int ans = right;
        while(left<=right){
            int mid = left +  (right-left)/2;
            int count = 0;
            for(int i = 0; i<quantities.size();i++){
                //ceil division to take the nearest max integer as per the solution and than add it to the count;
                count += (quantities[i] + mid-1)/mid;
            }
            if(count<=n){
                ans= mid;
                right = mid-1;
            }
            else{
                left = mid+1;
            }
        }
        return ans;
    }
};