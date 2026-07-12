class Solution {
public:
    long long minimalKSum(vector<int>& nums, int k) {
        sort(nums.begin(), nums.end());
        
        long long sum = 0;
        long long x = 1;
        int i = 0;
        

        while (k > 0) {
            
            // Skip duplicates in nums
            while (i < nums.size() && nums[i] < x) i++;

            if (i < nums.size() && nums[i] == x) {
                x++;
                i++;
            }
            else {
                sum += x;
                x++;
                k--;
            }
        }

        return sum;
    }
};