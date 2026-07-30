class Solution {
public:
    int getDivisor(int n){
        int sum = n;
        int div = n/2;
        
        int count =1;
        while(div>0 && count  < 4){
            if(n%div == 0){
                sum += div;
                count++;
                div--;
            }else{
                div--;
            }
        }
        if(div == 0 && count == 4){
            return sum;
        }
        return 0;
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