class Solution {
public:
    int elevatorRequests(int n, vector<int>& requests) {
        int tt = 0;
        int cf = 0;

        for (int target : requests) {
            tt += abs(target - cf);
            cf = target;
        }

        return tt;
    }
};