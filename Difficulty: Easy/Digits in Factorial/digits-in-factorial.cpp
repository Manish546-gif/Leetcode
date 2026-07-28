class Solution {
  public:
    int digitsInFactorial(int n) {
        // code here
         if (n < 0) return 0;
    if (n <= 1) return 1;

    double logSum = 0;
    for (int i = 1; i <= n; i++) {
        logSum += log10(i);
    }
    
    return floor(logSum) + 1;
    }
};