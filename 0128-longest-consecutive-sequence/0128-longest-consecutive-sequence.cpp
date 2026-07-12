class Solution {
public:
    int longestConsecutive(vector<int>& nums) {
        unordered_set<int>st;

        for(int i = 0; i<nums.size(); i++){
            st.insert(nums[i]);
        }
        int longest = 0;
        for(auto x : st){
            if(st.find(x-1)==st.end()){
                int count = 1; 
                while(st.find(x+count)!=st.end()){
                    count++;
                }
                longest = max(longest,count);                
            }
        }
        return longest;
    }
};