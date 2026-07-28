class Solution {
  public:
    bool isPalindrome(string& s) {
        // code here
        int l = 0;
        int r = s.length()-1;
        while(l <= r){
            if(s[l] != s[r]) return false;
            l++;
            r--;
        }
        
        return true;
    }
};