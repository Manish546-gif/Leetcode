class MinStack {
    stack<int>st1;
    stack<int>st2;
public:
    MinStack() {
        
    }
    
   void push(int value) {
         st1.push(value);
         if(!st2.empty()&& value<=st2.top()){
             st2.push(value);
         }
         if(st2.empty()){
             st2.push(value);
         }
    }
    void pop() {
        if(st1.empty()){
            return;
        }
        if(st1.top() == st2.top()){
            st1.pop();
            st2.pop();
        }else{
            st1.pop();
        }
    }
    
    int top() {
       
        return st1.top();
    }
    
    int getMin() {
        return st2.top();
    }
};

/**
 * Your MinStack object will be instantiated and called as such:
 * MinStack* obj = new MinStack();
 * obj->push(value);
 * obj->pop();
 * int param_3 = obj->top();
 * int param_4 = obj->getMin();
 */