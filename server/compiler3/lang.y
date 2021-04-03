%{
    #include <stdio.h>
    #include "util.h"
    #include "errormsg.h"
    #include "symbol.h"
    #include "absyn.h"
    #include "y.tab.h"
    #define YYDEBUG 1

    int yylex(void);
    A_decList absyn_root;

    void yyerror(char *s)
    {
        EM_error(EM_tokPos, "%s", s);
    }
%}

%union
{
    int pos;
    int ival;
    double fval;
    string sval;
    A_var var;
    A_exp exp;
    S_symbol sym;
    A_expList expList;
    A_stm stm;
    A_stmList stmList;
    A_ty type;
    A_dec dec;
    A_fundec funcdec;
    A_fieldList fieldList;
    A_decList decList;
}

%token <sval> ID STRING
%token <ival> INT
%token <fval> REAL

%type <sym> id
%type <var> lvalue
%type <exp> exp assignExp
%type <expList> explist
%type <stm> stm if while assign funcCall for return
%type <stmList> stmlist
%type <dec> declare funcDec
/* %type <funcdec> funcDec */
%type <type> type
%type <fieldList> tyfield1 tyfield
%type <decList> decs

%token
    COMMA COLON SEMICOLON LPAREN RPAREN LBRACK RBRACK LBRACE RBRACE DOT PLUS MINUS TIMES DIVIDE EQ 
    NEQ LT LE GT GE AND OR ASSIGN ARRAY IF THEN ELSE FROM TO BREAK INTTYPE STRINGTYPE
    REALTYPE CONTINUE RETURN TYPE VOID NUL TRUEE FALSEE BOOLEAN
 
%left SEMICOLON

%nonassoc UMINUS
%nonassoc LOWER_THAN_ELSE
%left ELSE
%left PLUS MINUS
%left TIMES DIVIDE
%left OR AND
%nonassoc EQ NEQ GT GE LT LE

%start program

%%

program: decs {absyn_root = $1;}

decs :   declare {$$ = A_DecList($1, NULL);}
            | funcDec {$$ = A_DecList($1, NULL);}
            | declare decs {$$ = A_DecList($1, $2);}
            | funcDec decs {$$ = A_DecList($1, $2);}

exp :       INT {$$ = A_IntExp(EM_tokPos, $1);}
            | STRING { $$ = A_StringExp(EM_tokPos, $1);}
            | REAL { $$ = A_RealExp(EM_tokPos, $1); }
            | NUL {$$ = A_NilExp(EM_tokPos);}
            | TRUEE {$$ = A_BoolExp(EM_tokPos, TRUE);}
            | FALSEE {$$ = A_BoolExp(EM_tokPos, FALSE);}
            | lvalue { $$ = A_VarExp(EM_tokPos, $1); }
            | assignExp {$$ = $1;}
            | exp PLUS exp {$$ = A_OpExp(EM_tokPos, A_plusOp, $1, $3);}
            | exp MINUS exp {$$ = A_OpExp(EM_tokPos, A_minusOp, $1, $3);}
            | exp TIMES exp {$$ = A_OpExp(EM_tokPos, A_timesOp, $1, $3);}
            | exp DIVIDE exp {$$ = A_OpExp(EM_tokPos, A_divideOp, $1, $3);}
            // 4 shift/reduce conflictss
            | MINUS exp %prec UMINUS {$$ = A_OpExp(EM_tokPos, A_minusOp, A_IntExp(0, 0), $2);}
            | exp EQ exp {$$ = A_OpExp(EM_tokPos, A_eqOp, $1, $3);}
            | exp NEQ exp {$$ = A_OpExp(EM_tokPos, A_neqOp, $1, $3);}
            | exp GE exp {$$ = A_OpExp(EM_tokPos, A_ltOp, $1, $3);}
            | exp GT exp {$$ = A_OpExp(EM_tokPos, A_leOp, $1, $3);}
            | exp LE exp {$$ = A_OpExp(EM_tokPos, A_gtOp, $1, $3);}
            | exp LT exp {$$ = A_OpExp(EM_tokPos, A_geOp, $1, $3);}
            // 6 shift/reduce conflicts
            | id LPAREN explist RPAREN {$$ = A_CallExp(EM_tokPos, $1, $3);} 
            | LPAREN exp RPAREN {$$ = $2;}
            | exp AND exp {$$ = A_IfExp(EM_tokPos, $1, $3, A_BoolExp(EM_tokPos, 0));}
            | exp OR exp {$$ = A_IfExp(EM_tokPos, $1, A_BoolExp(EM_tokPos, 1), $3);}

assignExp : lvalue ASSIGN exp { $$ = A_AssignExp(EM_tokPos, $1, $3);}

stm :       funcDec {$$ = A_DeclarationStm(EM_tokPos, $1);}
            | funcCall SEMICOLON 
            | assign SEMICOLON {$$ = $1;}
            | declare {$$ = A_DeclarationStm(EM_tokPos, $1);}
            | if {$$ = $1;}
            | while {$$ = $1;}
            | for {$$ = $1;}
            | return SEMICOLON{$$ = $1;}
            | BREAK SEMICOLON {$$ = A_BreakStm(EM_tokPos);}
            | CONTINUE SEMICOLON {$$ = A_ContinueStm(EM_tokPos);}
            | LBRACE stmlist RBRACE {$$ = A_CompoundStm(EM_tokPos, $2);}

/* stmlist :            {$$ = NULL;}
            | stm stmlist {$$ = A_CompoundStm(EM_tokPos, $1, $2);} */
stmlist :   stm {$$ = A_StmList($1, NULL);}
        |   stm stmlist {$$ = A_StmList($1, $2);}

return :    LPAREN exp RPAREN RETURN {$$ = A_ReturnStm(EM_tokPos, $2);}

type :      id {$$ = A_NameTy(EM_tokPos, $1);}
            | VOID {$$ = A_NameTy(EM_tokPos, S_Symbol("void"));}
            | INTTYPE {$$ = A_NameTy(EM_tokPos, S_Symbol("int"));}
            | STRINGTYPE {$$ = A_NameTy(EM_tokPos, S_Symbol("string"));}
            | REALTYPE {$$ = A_NameTy(EM_tokPos, S_Symbol("real"));}
            | BOOLEAN {$$ = A_NameTy(EM_tokPos, S_Symbol("int"));}

tyfield :   /* empty */ {$$ = NULL;}
            | tyfield1 {$$ = $1;}

tyfield1 :  type COLON id {$$ = A_FieldList(A_Field(EM_tokPos, $3, $1 -> u.name), NULL);}
            | type COLON id COMMA tyfield1 {$$ = A_FieldList(A_Field(EM_tokPos, $3, $1 -> u.name), $5);}

funcDec :   type COLON id LPAREN tyfield RPAREN ASSIGN stm {$$ = A_FunctionDec(EM_tokPos, A_FundecList(A_Fundec(EM_tokPos, $3, $5, $1 -> u.name, $8), NULL));}

funcCall :  id LPAREN RPAREN {$$ = A_CallStm(EM_tokPos, $1, NULL);}
            | id LPAREN explist RPAREN {$$ = A_CallStm(EM_tokPos, $1, $3);}

assign :    lvalue ASSIGN exp {$$ = A_AssignStm(EM_tokPos, $1, $3);}
            | lvalue PLUS PLUS {$$ = A_AssignStm(EM_tokPos, $1, A_OpExp(EM_tokPos, A_plusOp, A_VarExp(EM_tokPos, $1), A_IntExp(EM_tokPos, 1)));}
            | lvalue MINUS MINUS {$$ = A_AssignStm(EM_tokPos, $1, A_OpExp(EM_tokPos, A_minusOp, A_VarExp(EM_tokPos, $1), A_IntExp(EM_tokPos, 1)));}

declare :   type COLON assign SEMICOLON {$$ = A_VarDec(EM_tokPos, $3, $1 -> u.name);}
            | type COLON lvalue SEMICOLON{$$ = A_VarDec(EM_tokPos, A_AssignStm(EM_tokPos, $3, NULL), $1 -> u.name);}
            | TYPE COLON id ASSIGN LBRACE tyfield RBRACE SEMICOLON {A_TypeDec(EM_tokPos, A_NametyList(A_Namety($3, A_RecordTy(EM_tokPos, $6)), NULL));}

if :        IF LPAREN exp RPAREN THEN stm  %prec LOWER_THAN_ELSE {$$ = A_IfStm(EM_tokPos, $3, $6, NULL);}
            | IF LPAREN exp RPAREN THEN stm ELSE stm {$$ = A_IfStm(EM_tokPos, $3, $6, $8);}

while :     LPAREN exp RPAREN TO stm {$$ = A_WhileStm(EM_tokPos, $2, $5);}

for :       LPAREN exp RPAREN FROM LPAREN exp RPAREN TO LPAREN exp RPAREN stm {$$ = A_ForStm(EM_tokPos, $2, $6, $10, $12);}

explist:    exp COMMA explist {$$ = A_ExpList($1, $3);}
            | exp { $$ = A_ExpList($1, 0); }
            /* | empty {$$ = NULL;} */
            
id :        ID { $$ = S_Symbol($1); }

lvalue :    id {$$ = A_SimpleVar(EM_tokPos, $1);}
            | lvalue DOT id {$$ = A_FieldVar(EM_tokPos, $1, $3);}
 