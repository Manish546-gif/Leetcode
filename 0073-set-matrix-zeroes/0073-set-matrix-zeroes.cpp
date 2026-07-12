class Solution {
public:
    void setZeroes(vector<vector<int>>& matrix) {
        int row = matrix.size();
        int col = matrix[0].size();
        vector<bool> fill_row(row, false);
        vector<bool> fill_col(col, false);
        for(int i =0;i<matrix.size();i++){
            for(int j = 0; j<matrix[i].size();j++){
                if(matrix[i][j] == 0){
                    fill_col[j] = true;
                    fill_row[i] = true;
                }
            }
        }
         for(int i =0;i<matrix.size();i++){
            for(int j = 0; j<matrix[i].size();j++){
                if(fill_row[i] || fill_col[j]){
                    matrix[i][j] = 0;
                }
            }
        }
        
    }

};