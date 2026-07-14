class Node {
public:
    int val;
    Node* next;

    Node(int x) {
        val = x;
        next = nullptr;
    }
};

class MyLinkedList {
public:
    Node* head;

    MyLinkedList() {
        head = nullptr;
    }

    int get(int index) {
        Node* temp = head;

        while (temp != nullptr && index > 0) {
            temp = temp->next;
            index--;
        }

        if (temp == nullptr)
            return -1;

        return temp->val;
    }

    void addAtHead(int val) {
        Node* temp = new Node(val);
        temp->next = head;
        head = temp;
    }

    void addAtTail(int val) {
        Node* temp = new Node(val);

        if (head == nullptr) {
            head = temp;
            return;
        }

        Node* curr = head;
        while (curr->next != nullptr) {
            curr = curr->next;
        }

        curr->next = temp;
    }

    void addAtIndex(int index, int val) {
        if (index == 0) {
            addAtHead(val);
            return;
        }

        Node* curr = head;

        for (int i = 0; i < index - 1 && curr != nullptr; i++) {
            curr = curr->next;
        }

        if (curr == nullptr)
            return;

        Node* temp = new Node(val);
        temp->next = curr->next;
        curr->next = temp;
    }

    void deleteAtIndex(int index) {
        if (head == nullptr)
            return;

        if (index == 0) {
            Node* temp = head;
            head = head->next;
            delete temp;
            return;
        }

        Node* prev = nullptr;
        Node* curr = head;

        for (int i = 0; i < index && curr != nullptr; i++) {
            prev = curr;
            curr = curr->next;
        }

        if (curr == nullptr)
            return;

        prev->next = curr->next;
        delete curr;
    }
};

/**
 * Your MyLinkedList object will be instantiated and called as such:
 * MyLinkedList* obj = new MyLinkedList();
 * int param_1 = obj->get(index);
 * obj->addAtHead(val);
 * obj->addAtTail(val);
 * obj->addAtIndex(index,val);
 * obj->deleteAtIndex(index);
 */