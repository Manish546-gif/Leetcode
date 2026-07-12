class Solution {
public:
    int binaryGap(int n) {
        string ans = "";
        while(n > 0){
            ans = char('0' + (n % 2)) + ans;
            n /= 2;
        }
        int count = 0;
        int first = 0;
        for(int i=0; i<ans.length(); i++){
            if(ans[i]=='1'){
                count = max(count, i - first);
                first = i;
            }
        }
        return count;
    }
};