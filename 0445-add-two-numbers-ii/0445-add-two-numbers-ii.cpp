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
    ListNode* reverse(ListNode* head){
    ListNode* curr = head;
    ListNode* prev = nullptr;

    while(curr){
        ListNode* next = curr->next;
        curr->next = prev;
        prev = curr;
        curr = next;
    }

    return prev;
}

ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {

    ListNode* r_l1 = reverse(l1);
    ListNode* r_l2 = reverse(l2);

    ListNode* temp = new ListNode(0);
    ListNode* pr = temp;

    int carry = 0;

    while(r_l1 != nullptr || r_l2 != nullptr || carry != 0){

        int sum = carry;

        if(r_l1 != nullptr){
            sum += r_l1->val;
            r_l1 = r_l1->next;
        }

        if(r_l2 != nullptr){
            sum += r_l2->val;
            r_l2 = r_l2->next;
        }

        carry = sum / 10;
        temp->next = new ListNode(sum % 10);
        temp = temp->next;
    }

    return reverse(pr->next);   // Reverse the answer before returning

       
       
       
       
    
       
       //approach with stack 
        // stack<int> st1;
        // stack<int> st2;

        // while (l1 != nullptr || l2 != nullptr) {
        //     if (l1 != nullptr) {
        //         st1.push(l1->val);
        //         l1 = l1->next;
        //     }
        //     if (l2 != nullptr) {
        //         st2.push(l2->val);
        //         l2 = l2->next;
        //     }
        // }

        // ListNode* head = nullptr;
        // int carry = 0;

        // while (!st1.empty() || !st2.empty() || carry != 0) {
        //     int sum = carry;

        //     if (!st1.empty()) {
        //         sum += st1.top();
        //         st1.pop();
        //     }

        //     if (!st2.empty()) {
        //         sum += st2.top();
        //         st2.pop();
        //     }

        //     carry = sum / 10;

        //     ListNode* node = new ListNode(sum % 10);
        //     node->next = head;
        //     head = node;
        // }

        // return head;
    }
};