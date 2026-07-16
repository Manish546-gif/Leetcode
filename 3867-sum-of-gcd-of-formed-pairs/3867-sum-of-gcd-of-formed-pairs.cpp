class Solution {
public:
    long long gcdSum(vector<int>& nums) {
        
        long long mx =0;
        for(int i = 0; i<nums.size(); i++){
            if(nums[i]>= mx){
                mx = nums[i];
            }
            nums[i] = gcd(mx,nums[i]);
        }
        sort(nums.begin(), nums.end());
        long long  sum = 0;
        int left = 0;
        int right = nums.size()-1;
        while(left < right){
            sum += gcd(nums[left], nums[right]);
            left++;
            right--;
        }
        return sum;
    }
};