class Solution {
public:
    int minimumPushes(string word) {
        int n = word.length();
        int cost = 1;
        int ans= 0;
        while(n>0){
            int tk = min(8,n);
            ans += tk*cost;
            n -= tk;
            cost++;
        }
        return ans;
    }
};