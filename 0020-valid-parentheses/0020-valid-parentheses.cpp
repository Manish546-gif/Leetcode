class Solution {
public:
    bool isValid(string s) {
        
        stack<char> st;
        st.push(s[0]);

        for(int i=1;i<s.length();i++){

            char ch=s[i];

            if(!st.empty() && st.top()=='{' && ch=='}'){
                st.pop();
            }
            else if(!st.empty() && st.top()=='(' && ch==')'){
                st.pop();
            }
            else if(!st.empty() && st.top()=='[' && ch==']'){
                st.pop();
            }
            else{
                st.push(ch);
            }

            
        }
        return st.empty();
    }
};