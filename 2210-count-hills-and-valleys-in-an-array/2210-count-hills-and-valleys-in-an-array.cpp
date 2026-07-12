class Solution {
public:
    int countHillValley(vector<int>& nums) {
        
        int a = 0;

        for(int i=1;i<nums.size()-1;i++){

            if(nums[i] == nums[i-1])
                continue;

            // left
            int left = nums[i];
            int j = i-1;
            while(j >= 0){
                if(left != nums[j]){
                    left = nums[j];
                    break;
                }
                j--;
            }

            // right
            int right = nums[i];
            j = i+1;
            while(j < nums.size()){
                if(right != nums[j]){
                    right = nums[j];
                    break;
                }
                j++;
            }

            // cout<<"left : "<<left<<" right : "<<right<<" nums[i] : "<<nums[i]<<endl;

            if(nums[i] < left && nums[i] < right)
                a++;
            else if(nums[i] > right && nums[i] > left)
                a++;

        }
        return a;

    }
};