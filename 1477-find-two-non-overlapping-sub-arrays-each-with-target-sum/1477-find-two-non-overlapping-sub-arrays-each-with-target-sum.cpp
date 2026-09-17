class Solution {
public:
    int minSumOfLengths(vector<int>& arr, int target) {
        int n = arr.size();
        int j = 0;
        int sum = 0;
        int ans = INT_MAX;
        int best = INT_MAX;
        vector<int> prefix(n, INT_MAX);
        for (int i = 0; i < n; i++) {
            sum += arr[i];
            while (sum > target) {
                sum -= arr[j];
                j++;
            }
            if (sum == target) {
                int len = i - j + 1;
                if (j > 0 && prefix[j - 1] != INT_MAX) {
                    ans = min(ans, prefix[j - 1] + len);
                }
                best = min(best, len);
            }
            prefix[i] = best;
        }
        return ans == INT_MAX ? -1 : ans;
    }
};