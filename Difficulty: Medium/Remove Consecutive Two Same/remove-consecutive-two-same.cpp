
class Solution {
  public:
    string removePair(string &s) {
        string res = "";

        for (char c : s) {
            if (!res.empty() && res.back() == c) {
                res.pop_back(); 
            } else {
                res.push_back(c);
            }
        }

        return res.empty() ? "-1" : res;
    }
};