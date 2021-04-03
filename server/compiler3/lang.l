%{
    #include <stdio.h>
    #include "util.h"
    #include "symbol.h"
    #include "absyn.h"
    #include "y.tab.h"
    #include "errormsg.h"

    int charPos = 1;

    int yywrap(void)
    {
        charPos = 1;
        return 1;
    }

    void adjust(void)
    {
        EM_tokPos = charPos;
        charPos += yyleng;
    }

    void charAdjust(void)
    {
        EM_tokPos = charPos;
        charPos += yyleng;
    }
%}
digits [0-9]+
char [㐀-龯ぁ-んァ-ヶa-zA-Z]
charAndNum [㐀-龯ぁ-んァ-ヶ]*
%%

" " {adjust(); continue;}
\n {adjust(); EM_newLine(); continue;}
"," {adjust(); return COMMA;}
\. {adjust(); return DOT;}
{digits} {adjust(); yylval.ival = atoi(yytext); return INT;}
{digits}\.{digits}f? {adjust(); yylval.fval = atof(yytext); return REAL;}
\".*\" {adjust(); yylval.sval = strdup(yytext); return STRING;}
: {adjust(); return COLON;}
; {adjust(); return SEMICOLON;}
\( {adjust(); return LPAREN;}
\) {adjust(); return RPAREN;}
\[ {adjust(); return LBRACK;}
\] {adjust(); return RBRACK;}
\{ {adjust(); return LBRACE;}
\} {adjust(); return RBRACE;}
\. {adjust(); return DOT;}
\+ {adjust(); return PLUS;}
\- {adjust(); return MINUS;}
\* {adjust(); return TIMES;}
\/ {adjust(); return DIVIDE;}
== {adjust(); return EQ;}
!= {adjust(); return NEQ;}
\<= {adjust(); return LE;}
\>= {adjust(); return GE;}
\< {adjust(); return LT;}
\> {adjust(); return GT;}
&& {adjust(); return AND;}
\|\| {adjust(); return OR;}
= {adjust(); return ASSIGN;}

もし {adjust(); return IF;}
ならば {adjust(); return THEN;}
でなければ {adjust(); return ELSE;}
から {adjust(); return FROM;}
まで {adjust(); return TO;}
抜ける {adjust(); return BREAK;}
次へ {adjust(); return CONTINUE;}
整数 {adjust(); return INTTYPE;}
文字列 {adjust(); return STRINGTYPE;}
実数 {adjust(); return REALTYPE;}
返す {adjust(); return RETURN;}
型 {adjust(); return TYPE;}
無 {adjust(); return VOID;}
空 {adjust(); return NUL;}
真偽 {adjust(); return BOOLEAN;}
真 {adjust(); return TRUEE;}
偽 {adjust(); return FALSEE;}

{char}{charAndNum} {adjust(); yylval.sval = strdup(yytext); return ID;}
.	 {adjust(); EM_error(EM_tokPos,"illegal token");}

