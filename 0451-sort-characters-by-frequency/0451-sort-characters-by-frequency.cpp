class Solution {
public:
    string frequencySort(string s) {
        string ans;
        unordered_map<char, int> mp;
        for(auto c: s){
                mp[c]++;
        }
        priority_queue<pair<int, char>>pq;
        for(auto it:mp){
            pq.push({it.second , it.first});
        }
        while(!pq.empty()){
            int freq = pq.top().first;
            char ch = pq.top().second;
            pq.pop();
            ans += string(freq , ch);
        }
        return ans;
    }
};