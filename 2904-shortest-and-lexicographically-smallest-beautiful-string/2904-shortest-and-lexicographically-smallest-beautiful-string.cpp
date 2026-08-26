class Solution {
public:
    string shortestBeautifulSubstring(string s, int k) {
      string ans;
        int n = s.size();
        for(int i = 0; i < n; i++) {
            string b = "";
            int count = 0;
            for(int j = i; j < n; j++) {
                b.push_back(s[j]);
                if(s[j] == '1')
                    count++;
                if(count == k) {
                    if(ans.size() == 0 ||
                       b.size() < ans.size() ||
                       (b.size() == ans.size() && b < ans)) {
                        ans = b;
                    }
                    break;
                }
                if(count > k)
                    break;
            }
        }
        return ans;   
    }
};