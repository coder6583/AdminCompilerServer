#include <stdio.h>
#include "util.h"
#include "errormsg.h"
#include "symbol.h"
#include "absyn.h"
#include "y.tab.h"
#include "parse.h"
#include <stdlib.h>
#include <string.h>

YYSTYPE yylval;
extern int yydebug;

int yylex(void);

extern int yyparse(void);

string toknames[] = 
{
    "ID", "STRING", "INT", "REAL", "COMMA", "COLON", "SEMICOLON", "LPAREN", "RPAREN", "LBRACK", "RBRACK",
    "LBRACE", "RBRACE", "DOT", "PLUS", "MINUS", "TIME", "DIVIDE", "EQ", "NEQ", "LT", "LE",
    "GT", "GE", "AND", "OR", "ASSIGN", "ARRAY", "IF", "THEN", "ELSE", "FROM", "TO", "BREAK",
    "INTTYPE", "CHARTYPE", "STRINGTYPE", "REALTYPE", "CONTINUE"
};

string tokname(tok)
{
    return tok<258 || tok>295 ? "BAD_TOKEN" : toknames[tok-258];
}

void parseTest(string fname)
{
    EM_reset(fname);
    if(yyparse() == 0)
    {
        fprintf(stderr, "Parsing Successful\n");
    }
    else
    {
        fprintf(stderr, "Parsing Failed\n");
    }
}

int main(int argc, char **argv)
{
    // yydebug = 1;
    string fname, directory;
    int tok;
    if(argc != 2 && argc != 3)
    {
        fprintf(stderr, "usage: ./a.out filename\n      ./a.out filename directory\nargument count: %d\n", argc);
        exit(1);
    }
    fname = argv[1];
    directory = argv[2];
    string tempFileName = concat(".", fname);
    if(argc == 3)
    {
        string fullFname = concat(directory, fname);
        string fullTempFname = concat(directory, tempFileName);
        FILE *temp = fopen(fullTempFname, "w");
        fclose(temp);
        EM_reset(fullTempFname);
        while(!toByte(fullFname, fullTempFname));
        fprintf(stdout, "\n");
        // parse(tempFileName);
        // parseTest(fullTempFname);
        SEM_transProg(parse(fullTempFname));
    }
    else
    {
        FILE *temp = fopen(tempFileName, "w");
        fclose(temp);
        EM_reset(tempFileName);
        while(!toByte(fname, tempFileName));
        fprintf(stdout, "\n");
        SEM_transProg(parse(tempFileName));
        // parse(tempFileName);
        // parseTest(tempFileName);
    }
    return 0;
}