class Solution {
public:
    int maxProduct(int n) {
        int first = 0;
        int second = 0; 
        while(n>0){
            int rem = n%10;
            if(rem >= first){
                second = first;
                first = rem;
            }
            if(rem < first  && rem > second){
                second = rem;
            }
            n /=10;
        }
       
        return first*second;
    }
    
};