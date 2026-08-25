class Solution {
public:
    vector<int> distinctPrimeFactors(int n, vector<int>& pf) {
        vector<int> factors;
        while (n > 1) {
            int p = pf[n];
            factors.push_back(p);
            while (n % p == 0)
                n /= p;
        }

        return factors;
    }
    int longestSubarray(vector<int>& nums, int k) {
        unordered_map<int, int> m;
        int mx = *max_element(nums.begin(), nums.end());
        vector<int> pf(mx + 1);
        for (int i = 0; i <= mx; i++)
            pf[i] = i;
        for (int i = 2; i * i <= mx; i++) {
            if (pf[i] == i) {
                for (int j = i * i; j <= mx; j += i) {
                    if (pf[j] == j)
                        pf[j] = i;
                }
            }
        }
        int j = 0;
        int ans = 0;
        for (int i = 0; i < nums.size(); i++) {
            for (int p : distinctPrimeFactors(nums[i], pf))
              m[p]++;
            while (m.size() > k) {
                for (int p : distinctPrimeFactors(nums[j], pf)) {
                    m[p]--;
                    if (m[p] == 0)
                        m.erase(p);
                }
                j++;
            }
            ans = max(ans, i - j + 1);
        }
        return ans;
    }
};
