/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    vector<int> nodesBetweenCriticalPoints(ListNode* head) {
       int high = INT_MIN;
        int low = INT_MAX;
        int abs = 0;
        vector<int> ans;
        int first = 0;
        int second = 0;
        int count = 2;
        if (head == nullptr || head->next == nullptr || head->next->next == nullptr) {
            return {-1, -1};
        }
        ListNode * prev = head;
        ListNode * curr = head->next;
        ListNode * nex = curr->next;
        while (nex != nullptr) {
            if ((prev->val < curr->val && curr->val > nex->val) || 
                (prev->val > curr->val && curr->val < nex->val)) {
                
                if (first == 0) {
                    first = count;
                    abs = count; 
                } else {
                    second = count;
                    high = max(high, second - abs);     
                    low = min(low, second - first);   
                    first = second;                     
                }
            }

            prev = curr;
            curr = nex;
            nex = nex->next;
            count++;
        }
        if (high == INT_MIN) {
            return {-1, -1};
        }
        ans.push_back(low);
        ans.push_back(high);
        return ans;
        
    }
};