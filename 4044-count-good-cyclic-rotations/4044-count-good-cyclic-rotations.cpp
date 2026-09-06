class Solution {
public:
    int countGoodRotations(vector<int>& nums) {
        int n = nums.size();
        vector<long long>prefixsum(n);
        prefixsum[0] = nums[0];
        for(int i =1; i<n; i++){
            prefixsum[i] += nums[i] + prefixsum[i-1];
        }

       long long total = prefixsum[n-1];
        int j  =  -1;
        int i = 0;
        int ans = 0;
        long long sum =  0;
        while(j<n-1){
            if(i+n/2 <= n){
                if(i == 0){
                    sum = prefixsum[i+n/2 -1];
                }
                else{
                    sum = prefixsum[i+n/2-1] - prefixsum[i-1];
                }
            }
            else{
                sum = total - prefixsum[i-1] + prefixsum[(i+n/2-1)%n];
            }
            i = (i+1)%n;
            j++;
            if((long long)2*sum > (long long)total){
                ans++;
            }
            
        }
    return ans;


    }
};