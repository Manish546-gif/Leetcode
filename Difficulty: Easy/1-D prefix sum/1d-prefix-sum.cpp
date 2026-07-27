class Solution {
  public:
    vector<int> prefSum(vector<int> &arr) {
        // code here
        if(arr.size() == 1) return arr;
        for(int i = i; i<arr.size(); i++){
            arr[i] = arr[i-1]+arr[i];
        }
        return arr;
    }
};