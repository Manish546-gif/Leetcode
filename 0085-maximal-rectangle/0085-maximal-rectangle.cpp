class Solution {
public:
    int maximalRectangle(vector<vector<char>>& matrix) {
        int n = matrix[0].size();
        vector<int> heights(n, 0);
        int ans = 0;
        for(int i = 0; i<matrix.size(); i++){
            for(int j = 0; j<n; j++){
                if(matrix[i][j] == '1'){
                    heights[j] = heights[j] + 1;
                    
                }else{
                    heights[j] = 0;
                }
                cout<<heights[j]<<"   ";
            }
            vector<int> right(n);
            vector<int> left(n);
            stack<int> st;

            for (int i = n - 1; i >= 0; i--) {
                while (!st.empty() && heights[st.top()] >= heights[i]) {
                    st.pop();
                }
                right[i] = st.empty() ? n : st.top();
                st.push(i);
            }
            while (!st.empty()) {
                st.pop();
            }
            for (int i = 0; i < n; i++) {
                while (!st.empty() && heights[st.top()] >= heights[i]) {
                    st.pop();
                }
                left[i] = st.empty() ? -1 : st.top();
                st.push(i);
            }

            for (int i = 0; i < n; i++) {
                int area = heights[i] * (right[i] - left[i] - 1);
                ans = max(ans, area);
            }
        }
        return ans;
    }
};