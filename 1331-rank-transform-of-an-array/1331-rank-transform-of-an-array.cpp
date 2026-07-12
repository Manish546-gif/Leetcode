class Solution {
public:
    vector<int> arrayRankTransform(vector<int>& arr) {
        vector<int> copy = arr;
        sort(copy.begin(), copy.end());
        unordered_map<int , int>mp;
        int rank = 0;
        for(int i =0; i<copy.size(); i++){
            if(mp.find(copy[i]) == mp.end()){
                rank++;
                mp[copy[i]] = rank;
            }
            mp[copy[i]] = rank;
        }
        for(int i = 0; i<arr.size();i++){
            arr[i] = mp[arr[i]];
        }
        return arr;
    }
};