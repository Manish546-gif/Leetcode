class Solution {
public:
    vector<int> lastVisitedCell(vector<vector<char>>& grid) {
          int m = grid.size(), n = grid[0].size();
           int r = 0, c = 0;

        while (true) {
            char ch = grid[r][c];

            // Mark current cell as visited
            grid[r][c] = '#';

            int nr = r, nc = c;

            if (ch == 'L') nc--;
            else if (ch == 'R') nc++;
            else if (ch == 'U') nr--;
            else if (ch == 'D') nr++;

            // Stop if outside the grid
            if (nr < 0 || nr >= m || nc < 0 || nc >= n)
                break;

            // Stop if the next cell was visited
            if (grid[nr][nc] == '#')
                break;

            r = nr;
            c = nc;
        }

        return {r, c};
    }
};