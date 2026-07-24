class Solution {
public:
    int uniqueXorTriplets(vector<int>& nums) {
        unordered_set<int> pair;
        unordered_set<int> ans;

        int n = nums.size();

        // Store unique pair XORs
        for (int i = 0; i < n; i++) {
            for (int j = i; j < n; j++) {
                pair.insert(nums[i] ^ nums[j]);
            }
        }

        // XOR every unique pair XOR with every element
        for (int x : pair) {
            for (int num : nums) {
                ans.insert(x ^ num);
            }
        }

        return ans.size();
    }
};