class Solution {
public:
    int solve(vector<vector<int>>&mat , int i,int j,int &maxi,vector<vector<int>>&dp)
    {
        if(i >= mat.size() || j>=mat[0].size())
            return 0;

        if(dp[i][j] != -1)
            return dp[i][j];

        int ans = 0;

        int right = solve(mat,i,j+1,maxi,dp);
        int down = solve(mat,i+1,j,maxi,dp);
        int dia = solve(mat,i+1,j+1,maxi,dp);

        if(mat[i][j] == 1)
        {
            ans = 1 + min(right,min(down,dia));
            maxi += ans;
        }
        return dp[i][j] =  ans;
    }
    int countSquares(vector<vector<int>>& matrix) {
        vector<vector<int>>dp(matrix.size(),vector<int>(matrix[0].size(),-1));

        int maxi = 0;
        solve(matrix,0,0,maxi,dp);
        return maxi;
    }
};