class Solution {
public:
    ListNode* deleteDuplicates(ListNode* head) {
        if(head == nullptr || head->next == nullptr){
            return head;
        }

        ListNode* prev = head;
        ListNode* curr = head->next;

        while(curr != nullptr){
            if(prev->val == curr->val){
                prev->next = curr->next;
                curr = prev->next;
            }
            else{
                prev = curr;
                curr = curr->next;
            }
        }

        return head;
    }
};