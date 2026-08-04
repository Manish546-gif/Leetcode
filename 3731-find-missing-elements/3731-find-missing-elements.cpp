class Solution {
public:
    vector<int> findMissingElements(vector<int>& nums) {
        priority_queue<int> maxq;
        for(auto &x : nums){
            maxq.push(x);
        }
        vector<int>ans;
        int x= maxq.top();
        while(!maxq.empty()){
            if(x == maxq.top()){
                x--;
                maxq.pop();
            }
            else{
                ans.push_back(x);
                x--;
            }
        }
        reverse(ans.begin(), ans.end());
        return ans;
    }
};