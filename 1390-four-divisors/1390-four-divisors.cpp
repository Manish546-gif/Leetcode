class Solution {
public:
   int getDivisor(int n) {
    int sum = 0;
    int count = 0;

    for (int div = 1; div <= n; div++) {
        if (n % div == 0) {
            count++;
            sum += div;

            if (count > 4)
                return 0;
        }
    }

    return (count == 4) ? sum : 0;
}


    int sumFourDivisors(vector<int>& nums) {
        int n = nums.size();
        int ans = 0;

        for(int i = 0; i<n; i++){
            int x =  getDivisor(nums[i]);
            ans +=x;
        }

        return ans;
    }
};