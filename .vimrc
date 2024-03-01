"          _                                                                
"  __   __(_) _ __ ___   _ __  ___
"  \ \ / /| || '_ ` _ \ | '__|/ __|
"  _\ V / | || | | | | || |  | (__
" (_)\_/  |_||_| |_| |_||_|   \___|

" set highlight for language syntax
syntax on

" show line numbers
set number

" show relative line number 
" and by {count}j to move down, {count}k to move up
set relativenumber

" change cursor setting
" 1: blink block
" 2: solid block 
" 3: blinking underscore
" 4: solid underscore
" 5: blinking vertical bar
" 6: solid vertical bar
let &t_SI.="\e[5 q" "SI = INSERT mode 
let &t_SR.="\e[4 q" "SR = REPLACE mode 
let &t_EI.="\e[2 q" "EI = NORMAL mode(ELSE) 

" SET backspace behavior,make it behave like in other programs
" set backspace=indent,eol,start