class Solution {
public:
bool iszero(int x){
    while(x>0){
        if(x%10 == 0) return false;
        x /= 10;
    }
    return true;
}
    vector<int> getNoZeroIntegers(int n) {
       for(int a = 1; a<n; a++){
        int b = n-a;
        if(iszero(a) && iszero(b)){
            return {a,b};
        }
       }
       return {};
    }
};