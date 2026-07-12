class Solution {
public:
    void rotate(vector<vector<int>>& matrix) {
        int n = matrix.size();
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                int temp = matrix[i][j];
                matrix[i][j] = matrix[j][i];
                matrix[j][i] = temp;
            }
        }
        for (int i = 0; i < n; i++) {
            int k = 0;
            int p = n - 1;
            while (k < p) {
                int temp = matrix[i][k];
                matrix[i][k] = matrix[i][p];
                matrix[i][p] = temp;
                k++;
                p--;
            }
        }
    }
};
