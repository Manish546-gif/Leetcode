// The API isBadVersion is defined for you.
// bool isBadVersion(int version);

class Solution {
public:
    int firstBadVersion(int n) {
        int first = 1;
        int last = n;
        int ans =n;
        while(first <= last){
            int mid = first + (last-first)/2;

            if(isBadVersion(mid)){
                ans = mid;
                last = mid -1;
            }
            else first = mid+1;
        }
        return ans;
    }
};