class Solution {
public:
    bool checkOverlap(int radius, int xCenter, int yCenter, int x1, int y1, int x2, int y2) {
        int X = clamp(xCenter, x1, x2);
        int Y = clamp(yCenter, y1, y2);
        int dx = xCenter - X;
        int dy = yCenter - Y;

        return (dx * dx + dy * dy) <= (radius * radius);
    }
};