class Solution {
public:
    int maxDistance(vector<int>& colors) {
           int x = 0;
           int x2 = 0;
           for(int i = 0; i<colors.size() ; i++){
            for(int j =0; j<colors.size(); j++){
                if(colors[i] != colors[j]){
                    x2 = abs(i-j);
                    x = max(x,x2);
                }
            }
           }
           return x;
    }
};