/*
// Definition for a Node.
class Node {
public:
    int val;
    Node* next;
    Node* random;
    
    Node(int _val) {
        val = _val;
        next = NULL;
        random = NULL;
    }
};
*/

class Solution {
public:
    Node* copyRandomList(Node* head) {
        unordered_map<Node*, Node*>track;
       
        Node* tra = head;
        while(tra != NULL){
            track[tra] = new Node(tra->val);
            tra = tra->next;
        }
        tra = head;
        while (tra != NULL) {
            track[tra]->next = track[tra->next];
            track[tra]->random = track[tra->random];
            tra = tra->next;
        }

        return track[head];


    }
};