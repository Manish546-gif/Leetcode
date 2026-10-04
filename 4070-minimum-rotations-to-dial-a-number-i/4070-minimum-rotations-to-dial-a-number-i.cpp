class Solution {
public:
    int minRotations(string s) {
        int totalRotations = 0;
        int currentDigit = 0;

        for (char c : s) {
            int targetDigit = c - '0';
            int diff = abs(targetDigit - currentDigit);
            totalRotations += min(diff, 10 - diff);
            currentDigit = targetDigit;
        }

        return totalRotations;
    }
};