class Solution {
public:
    string decodeMessage(string key, string message) {
        unordered_map<char, char>mp;
        char curr = 'a';

         for (char c : key) {
            if (c == ' ') continue;
            if (mp.find(c) == mp.end()) {
                mp[c] = curr++;
            }
        }

        for (char &c : message) {
            if (c != ' ') {
                c = mp[c];
            }
        }
        return message;
    }
};