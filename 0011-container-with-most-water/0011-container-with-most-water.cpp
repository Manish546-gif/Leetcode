class Solution {
public:
    int maxArea(vector<int>& height) {
        int ans = 0;
        int left = 0;
        int right = height.size() - 1;
        while (right > left) {
            if (height[right] > height[left]) {
                ans=max(ans,(right-left)*(height[left]));
                left++;
              
            }
            else {
              ans=max(ans,(right-left)*(height[right]));
              right--;}
        }
        return ans;
    }
};