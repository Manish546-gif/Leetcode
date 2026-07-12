class Solution {
public:
    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
        vector<int> temp(nums1.size() + nums2.size());

        int i = 0, j = 0, k = 0;

        // merge both arrays 
        while (i < nums1.size() && j < nums2.size()) {
            if (nums1[i] <= nums2[j]) {
                temp[k++] = nums1[i++];
            } else {
                temp[k++] = nums2[j++];
            }
        }

        // remaining elements if any elements are there extra condition
        while (i < nums1.size()) {
            temp[k++] = nums1[i++];
        }
        while (j < nums2.size()) {
            temp[k++] = nums2[j++];
        }

        int n = temp.size();

        // find median check kro n even hai ya odd
        if (n % 2 == 0) {
            return (temp[n/2 - 1] + temp[n/2]) / 2.0;
        } else {
            return temp[n/2];
        }
    }
};
