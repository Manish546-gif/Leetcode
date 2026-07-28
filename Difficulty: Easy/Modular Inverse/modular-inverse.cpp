class Solution {
public:
    int modInverse(int n, int m) {
        for (int i = 1; i < m; i++) {
           
            if ((1LL * n * i) % m == 1) {
                return i;
            }
        }
        return -1;
    }
};