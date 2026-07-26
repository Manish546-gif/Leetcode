class Solution {
public:
    int maximumProduct(vector<int>& nums) {
        int a = INT_MIN;
        int b = INT_MIN;
        int c = INT_MIN;

        int x = INT_MAX;
        int y = INT_MAX;

        for (int i = 0; i < nums.size(); i++) {
            int oa = a, ob = b, oc = c;
            int ox = x, oy = y;

          
            a = max(oa, nums[i]);
            b = max(ob, min(nums[i], oa));
            c = max(oc, min(nums[i], ob));
            
            x = min(ox, nums[i]);
            y = min(oy, max(nums[i], ox));
        }

        return max(a * b * c, a * x * y);
    }
};