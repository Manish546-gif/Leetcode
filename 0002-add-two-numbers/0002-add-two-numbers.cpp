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
    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
        ListNode * temp = new ListNode(0);
        ListNode* pr = temp;
        int rem = 0;
        while(l1 != nullptr && l2 != nullptr){
            int sum = 0;
            sum = l1->val + l2->val + rem;
            rem = sum/10;
            sum = sum%10;
            ListNode* toinsert = new ListNode(sum);
            temp->next = toinsert;
            temp = temp->next;
            l1 = l1->next;
            l2= l2->next;
        }

        while(l1 != nullptr){
             int sum = 0;
            sum = l1->val + rem;
            rem = sum/10;
            sum = sum%10;
            l1->val = sum;
            temp->next = l1;
            l1 = l1->next;
            temp = temp->next;
        }
        while(l2 != nullptr){
             int sum = 0;
            sum = l2->val + rem;
            rem = sum/10;
            sum = sum%10;
            l2->val = sum;
            temp->next = l2;
            l2 = l2->next;
            temp = temp->next;
        }
        if(rem == 1){
           ListNode* toinsert = new ListNode(rem);
           temp->next = toinsert; 
        }
        return pr->next;
    }
};