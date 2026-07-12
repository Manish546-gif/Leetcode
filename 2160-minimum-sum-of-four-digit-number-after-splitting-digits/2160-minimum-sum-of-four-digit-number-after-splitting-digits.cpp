class Solution {
public:
    int minimumSum(int num) {
        vector<int> nums(4 , 0);
        int rem;
        while(num != 0){
            rem = num%10;
            nums.push_back(rem);
            num = num/10;
        }
        sort(nums.begin(), nums.end());
        int new1=0;
        int new2=0;
        for(int i =0; i<nums.size();i++){
            if(i%2==0){
                new1 = new1*10 + nums[i];
            }
            else{
                new2 = new2*10 + nums[i];
            }
        }
        return new1+new2;

    }
};