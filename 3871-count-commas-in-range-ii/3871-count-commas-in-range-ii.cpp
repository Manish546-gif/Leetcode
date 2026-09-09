class Solution {
public:
    long long countCommas(long long n) {
        long long ans = 0;
        if(n >= 1000){
            ans += min(n , 999999LL)-999;
        }
        if(n>=1000000){
            ans += 2*(min(n,999999999LL)-1000000+1);
        }
        if (n >= 1000000000LL) {
            ans += 3 * (min(n, 999999999999LL) - 1000000000LL + 1);
        }
        if (n >= 1000000000000LL) {
            ans += 4 * (min(n, 999999999999999LL) - 1000000000000LL + 1);
        }
        if (n >= 1000000000000000LL) {
            ans += 5 * (n - 1000000000000000LL + 1);
        }

        return ans;
    }
};