class Solution {
public:
    bool isPalindromic(string s) {
         string binary = "";

    for(char c : s) {
        int x = (int)c;

        for(int i = 7; i >= 0; i--) {
            binary += ((x >> i) & 1) + '0';
        }
    }
    int n = binary.length()-1;
    int i = 0;
    while(i<=n){
        if(binary[i]!=binary[n]) return false;
        i++;
        n--;
    }
    return true;
    }
};