class Solution {
public:
    void rotate(vector<vector<int>>&mat){
        int i=0;
        int j = mat.size()-1;

        while(i < j){
            for(int k = 0;k<mat.size();k++){
                swap(mat[i][k],mat[j][k]);
            }
            i++;
            j--;
        }

        for(int i=0;i<mat.size();i++){
            for(int j=i;j<mat.size();j++){
                swap(mat[i][j],mat[j][i]);
            }
        }
    }
    bool findRotation(vector<vector<int>>& mat, vector<vector<int>>& target) {

        if(mat == target)
            return true;
        
        for(int i=0;i<3;i++){
            rotate(mat);

            if(mat == target)
                return true;
        }
        return false;

    }
};