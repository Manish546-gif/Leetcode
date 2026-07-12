class Solution {
public:
    double solve(double x, long long n) {
        if (n == 0) return 1.0;

        double ans = solve(x, n / 2);

        if (n % 2 == 0)
            return ans * ans;
        else
            return ans * ans * x;
    }

    double myPow(double x, int n) {
        //overflow ko rok dega 
        long long N = n;   

        if (N < 0) {
           return 1/solve(x ,N);
        }

        return solve(x, N);
    }
};
