compiler: lexAnalyze.o parse.o semantic.o env.o types.o y.tab.o absyn.o symbol.o table.o lex.yy.o errormsg.o util.o
	cc -g -o compiler lexAnalyze.o parse.o semantic.o env.o types.o y.tab.o absyn.o symbol.o table.o lex.yy.o errormsg.o util.o

lexAnalyze.o: lexAnalyze.c errormsg.h util.h
	cc -g -c lexAnalyze.c

parse.o: parse.c parse.h
	cc -g -c parse.c

semantic.o: semantic.c semantic.h
	cc -g -c semantic.c

env.o: env.c env.h
	cc -g -c env.c

types.o: types.c types.h
	cc -g -c types.c

y.tab.o: y.tab.c
	cc -g -c -DYYERROR_VERBOSE -DYYDEBUG=1 y.tab.c

y.tab.c: lang.y
	yacc -dv -v lang.y

y.tab.h: y.tab.c
	echo "created y.tab.h"

absyn.o: absyn.c absyn.h
	cc -g -c absyn.c

table.o: table.c table.h
	cc -g -c table.c

symbol.o: symbol.c symbol.h table.h
	cc -g -c symbol.c

errormsg.o: errormsg.c errormsg.h util.h
	cc -g -c errormsg.c

lex.yy.o: lex.yy.c errormsg.h util.h
	cc -g -c lex.yy.c

lex.yy.c: lang.l
	lex -w lang.l

util.o: util.c util.h
	cc -g -c util.c

clean: 
	rm -f compiler lexAnalyze.o parse.o semantic.o env.o types.o y.tab.o absyn.o symbol.o table.o lex.yy.o errormsg.o util.o
