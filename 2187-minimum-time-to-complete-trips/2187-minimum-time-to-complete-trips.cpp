class Solution {
public:
    long long minimumTime(vector<int>& time, int totalTrips) {

        long long left = 1;
        long long right = (long long)*min_element(time.begin(), time.end()) * totalTrips;
        long long ans = right;

        while(left <= right){

            long long mid = left + (right - left)/2;

            long long count = 0;
            for(int t : time){
                count += mid / t;
            }

            if(count >= totalTrips){
                ans = mid;
                right = mid - 1;
            }
            else{
                left = mid + 1;
            }
        }

        return ans;
    }
};
