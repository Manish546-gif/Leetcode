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
void reverse(ListNode* &head, ListNode* &curr, ListNode* &prev){
    //base case 
    if(curr == NULL){
        head= prev;
        return ;
    }
    ListNode* frwd = curr->next;
    reverse(head, frwd, curr);
    curr->next = prev;
}
    ListNode* reverseList(ListNode* head) {
        ListNode* curr = head;
        ListNode* prev = NULL;
        reverse(head, curr,prev);
        return head;


        // if(head == NULL || head->next==NULL){
        //     return head;
        // }
        // ListNode* prev = NULL;
        // ListNode* curr = head;
        // ListNode* frwd = NULL;
        // while(curr!=NULL){
        //     frwd = curr->next;
        //     curr->next = prev;
        //     prev= curr; 
        //     curr = frwd;
        // }
        // return prev; 
    }
};