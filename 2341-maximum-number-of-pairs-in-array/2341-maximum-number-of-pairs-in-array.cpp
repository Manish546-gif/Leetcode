class Solution {
public:
    vector<int> numberOfPairs(vector<int>& nums) {
        vector<int> arr(101, 0);

        for (int i = 0; i < nums.size(); i++) {
            arr[nums[i]]++;
        }

        int pairs = 0;
        int rem = 0;

        for (int i = 0; i < 101; i++) {
            pairs += arr[i] / 2;   
            rem += arr[i] % 2;    
        }

        return {pairs, rem};
    }
};
