#include <stdio.h>
#include "semantic.h"


static Ty_ty actual_ty(Ty_ty ty);
static Ty_tyList makeParamTypeList(S_table tenv, A_fieldList params);
static Ty_ty checkSymType(S_symbol sym);
static S_symbol returnSymFromType(Ty_ty);

void SEM_transProg(A_decList declist)
{
    S_table venv = S_empty(), tenv = S_empty();
    if(declist == NULL)
    {
        EM_error(0, "No code.");
    }
    A_decList decList;
    for(decList = declist; decList != NULL; decList = decList -> tail)
    {
        A_dec dec = decList -> head;
        if(dec == NULL)
        {
            return;
        }
        transDec(venv, tenv, decList -> head);
    }
}

struct expty transStm(S_table venv, S_table tenv, A_stm stm)
{
    switch(stm -> kind)
    {
        case A_compoundStm:
        {
            debug(stm -> pos, "Compound Statement");
            A_stmList stmlist;
            int i = 0;
            S_beginScope(venv);
            S_beginScope(tenv);
            for(i = 0, stmlist = stm -> u.compound; stmlist != NULL; stmlist = stmlist -> tail, i++)
            {
                if(stmlist -> head != NULL)
                {
                    A_stm stmHead = stmlist -> head;
                    transStm(venv, tenv, stmHead);
                }
            }
            S_endScope(venv);
            S_endScope(tenv);
            return expTy(NULL, Ty_Void());
            break;
        }
        case A_assignStm:
        {
            debug(stm -> pos, "Assign Statement");
            A_var var = stm -> u.assign.var;
            A_exp exp = stm -> u.assign.exp;
            E_enventry varType = S_look(venv, var->u.simple);
            Ty_ty expType = transExp(venv, tenv, exp).ty;
            if(var -> u.simple != NULL)
            {
                debug(stm -> pos, "Var : %s", S_name(var -> u.simple));
            }
            if(varType == NULL)
            {
                EM_error(stm -> pos, "%s is undefined.", S_name(var->u.simple));
            }
            if(varType-> u.var.ty != expType)
            {
                EM_error(stm -> pos, "The type %s cannot be assigned to %s of type %d.", S_name(returnSymFromType(expType)), S_name(var->u.simple), varType -> kind);
            }
            return expTy(NULL, Ty_Void());
        }
        case A_declarationStm:
        {    
            debug(stm -> pos, "Declaration Statement");
            struct expty exp;
            // S_beginScope(venv);
            // S_beginScope(tenv);
            transDec(venv, tenv, stm -> u.declaration.dec);
            exp = transExp(venv, tenv, stm->u.declaration.dec -> u.var.init);
            // S_endScope(venv);
            // S_beginScope(tenv);
            return exp;
            break;
        }
        case A_ifStm:
        {
            debug(stm -> pos, "If Statement");
            if(transExp(venv, tenv, stm -> u.iff.test).ty != Ty_Bool())
            {
                EM_error(stm -> pos, "If statement test expression must have a type of boolean.");
            }
            transStm(venv, tenv, stm -> u.iff.then);
            if(stm -> u.iff.elsee != NULL)
            {
                transStm(venv, tenv, stm -> u.iff.elsee);
            }
            return expTy(NULL, Ty_Void());
        }
        case A_whileStm:
        {
            debug(stm -> pos, "While Statement");
            struct expty body;
            if(transExp(venv, tenv, stm -> u.whilee.test).ty != Ty_Bool())
            {
                EM_error(stm -> pos, "While statement test expression must have a type of boolean.");
            }
            body = transStm(venv, tenv, stm -> u.whilee.body);
            return expTy(NULL, Ty_Void());
        }
        case A_forStm:
        {
            debug(stm -> pos, "For Statement");
            A_exp assignExp = stm -> u.forr.assign;
            if(assignExp -> kind == A_assignExp)
            {
                S_enter(venv, assignExp -> u.assign.var -> u.simple, E_VarEntry(transExp(venv, tenv, assignExp -> u.assign.exp).ty));
            }
            transExp(venv, tenv, assignExp);
            struct expty condition = transExp(venv, tenv, stm -> u.forr.condition);
            if(condition.ty != Ty_Bool())
            {
                EM_error(stm -> pos, "For statement condition expression must have a type of boolean.");
            }
            transExp(venv, tenv, stm -> u.forr.increment);
            transStm(venv, tenv, stm -> u.forr.body);
            return expTy(NULL, Ty_Void());
        }
        case A_breakStm:
        {
            debug(stm -> pos, "Break Statement");
            return expTy(NULL, Ty_Void());
        }
        case A_continueStm:
        {
            debug(stm -> pos, "Continue Statement");
            return expTy(NULL, Ty_Void());
        }
        case A_callStm:
        {
            debug(stm -> pos, "Call Statement");
            E_enventry entry = S_look(venv, stm -> u.call.func);
            if(entry != NULL && entry -> kind == E_funcentry)
            {
                A_expList expArgs;
                Ty_tyList entryArgsTy;
                int i = 1;
                for(i = 1, expArgs = stm -> u.call.args, entryArgsTy = entry -> u.func.formals; expArgs != NULL && entryArgsTy != NULL;
                             expArgs = expArgs -> tail, entryArgsTy = entryArgsTy -> tail, i++)
                {
                    A_exp exp = expArgs -> head;
                    Ty_ty type = entryArgsTy -> head;
                    if(exp != NULL && type != NULL)
                    {
                        struct expty argType = transExp(venv, tenv, exp);
                        if(actual_ty(type) != actual_ty(argType.ty))
                        {
                            EM_error(stm -> pos, "Type of argument %d does not match with type \'%s\'.", i, S_name(returnSymFromType(actual_ty(type))));
                        }
                    }
                    else
                    {
                        if(exp == NULL && type != NULL)
                        {
                            EM_error(stm -> pos, "There are too few arguments in the call statement.");
                            break;
                        }
                        else if(exp != NULL && type == NULL)
                        {
                            EM_error(stm -> pos, "There are too many arguments in the call statement.");
                            break;
                        }
                    }
                }
                if(expArgs == NULL && entryArgsTy != NULL)
                {
                    if(entryArgsTy -> head != NULL)
                    {
                        EM_error(stm -> pos, "There are too few arguments in the call statement.");
                    }
                }
                else if(expArgs != NULL && entryArgsTy == NULL)
                {
                    if(expArgs -> head != NULL)
                    {
                        EM_error(stm -> pos, "There are too many arguments in the call statement.");
                    }
                }
                return expTy(NULL, entry -> u.func.result);
            }
            else
            {
                EM_error(stm -> pos, "Undefined function \'%s\'", S_name(stm -> u.call.func));
            }
            return expTy(NULL, Ty_Void());
        }
        case A_returnStm:
        {
            debug(stm -> pos, "Return Statement");
            return expTy(NULL, Ty_Void());
        }
    }
}

struct expty transVar(S_table venv, S_table tenv, A_var v)
{
    switch(v -> kind)
    {
        case A_simpleVar:
        {
            E_enventry x = S_look(venv, v -> u.simple);
            if(x && x -> kind == E_varentry)
            {
                return expTy(NULL, actual_ty(x -> u.var.ty));
            }
            else if(!x)
            {
                EM_error(v -> pos, "It doesn't exist");
            }
            else if(x -> kind != E_varentry)
            {
                EM_error(v -> pos, "It is not a variable. %s", S_name(x -> u.var.ty -> u.name.sym));
            }
            else
            {
                EM_error(v -> pos, "undefined variable %s", S_name(v -> u.simple));
                return expTy(NULL, Ty_Int());
            }
            break;
        }
       case A_fieldVar:
       {
           break;
       }
       case A_subscriptVar:
       {
           break;
       }
    }
}

struct expty transExp(S_table venv, S_table tenv, A_exp e)
{
    switch(e -> kind)
    {
        case A_intExp:
        {
            // printf("%d a\n",Ty_Int() -> kind);
            return expTy(NULL, Ty_Int());
            break;
        }
        case A_stringExp:
        {
            // printf("string");
            return expTy(NULL, Ty_String());
            break;
        }
        case A_realExp:
        {
            return expTy(NULL, Ty_Real());
            break;
        }
        case A_boolExp:
        {
            return expTy(NULL, Ty_Bool());
            break;
        }
        case A_nilExp:
        {
            return expTy(NULL, Ty_Nil());
            break;
        }
        case A_varExp:
        {
            return transVar(venv, tenv, e -> u.var);
            break;
        }
        case A_callExp:
        {
            E_enventry entry = S_look(venv, e -> u.call.func);
            if(entry != NULL && entry -> kind == E_funcentry)
            {
                A_expList expArgs;
                Ty_tyList entryArgsTy;
                int i = 1;
                for(i = 1, expArgs = e -> u.call.args, entryArgsTy = entry -> u.func.formals; expArgs != NULL && entryArgsTy != NULL;
                             expArgs = expArgs -> tail, entryArgsTy = entryArgsTy -> tail, i++)
                {
                    A_exp exp = expArgs -> head;
                    Ty_ty type = entryArgsTy -> head;
                    if(exp != NULL && type != NULL)
                    {
                        struct expty argType = transExp(venv, tenv, exp);
                        if(actual_ty(type) != actual_ty(argType.ty))
                        {
                            debug(e -> pos, "%d", actual_ty(type) -> kind);
                            EM_error(e -> pos, "Type of argument %d does not match with type \'%s\'.", i, S_name(returnSymFromType(actual_ty(type))));
                        }
                    }
                    else
                    {
                        if(exp == NULL && type != NULL)
                        {
                            EM_error(e -> pos, "There are too few arguments in the call expression.");
                            break;
                        }
                        else if(exp != NULL && type == NULL)
                        {
                            EM_error(e -> pos, "There are too many arguments in the call expression.");
                            break;
                        }
                    }
                }
                if(expArgs == NULL && entryArgsTy != NULL)
                {
                    if(entryArgsTy -> head != NULL)
                    {
                        EM_error(e -> pos, "There are too many arguments in the call expression.");
                    }
                }
                else if(expArgs != NULL && entryArgsTy == NULL)
                {
                    if(expArgs -> head != NULL)
                    {
                        EM_error(e -> pos, "There are too few arguments in the call expression.");
                    }
                }
                return expTy(NULL, entry -> u.func.result);
            }
            else
            {
                EM_error(e -> pos, "Undefined function \'%s\'", S_name(e -> u.call.func));
            }
        }
        case A_recordExp:
        {
            return expTy(NULL, S_look(tenv, e -> u.record.typ));
        }
        case A_assignExp:
        {
            A_var var = e -> u.assign.var;
            A_exp exp = e -> u.assign.exp;
            Ty_ty varType = S_look(venv, var -> u.simple);
            Ty_ty expType = transExp(venv, tenv, exp).ty;
            if(varType != expType)
            {
                EM_error(e -> pos, "Cannot assign %s to %s.", varType -> u.name.sym, expType -> u.name.sym);
            }
            return expTy(NULL, transExp(venv, tenv, exp).ty);
        }
        case A_ifExp:
        {
            if(transExp(venv, tenv, e -> u.iff.test).ty != Ty_Bool())
            {
                EM_error(e -> pos, "Test expression needs to be a bool type.");
            }
            if(transExp(venv, tenv, e -> u.iff.then).ty != transExp(venv, tenv, e -> u.iff.elsee).ty)
            {
                EM_error(e -> pos, "Then expression and else expression must be of the same type.");
            }
            return expTy(NULL, actual_ty(transExp(venv, tenv, e -> u.iff.then).ty));
        }
        case A_opExp:
        {
            A_oper oper = e -> u.op.oper;
            struct expty left = transExp(venv, tenv, e -> u.op.left);
            struct expty right = transExp(venv, tenv, e -> u.op.right);
            if(oper == A_plusOp)
            {
                if(left.ty != NULL && right.ty != NULL)
                {
                    if(left.ty->kind == Ty_int && right.ty -> kind == Ty_int)
                        return expTy(NULL, Ty_Int());
                    if(left.ty -> kind == Ty_real && right.ty -> kind == Ty_int || 
                        left.ty -> kind == Ty_int && right.ty -> kind == Ty_real || 
                        left.ty -> kind == Ty_real && right.ty -> kind == Ty_real)
                        return expTy(NULL, Ty_Real());
                    if(left.ty -> kind == Ty_string && right.ty -> kind == Ty_string)
                        return expTy(NULL, Ty_String());
                    else
                        EM_error(e -> u.op.left -> pos, "The two operands cannot be added.");
                }
                else 
                {
                    if(left.ty == NULL && right.ty != NULL)
                        EM_error(e -> pos, "Left operand does not have a type.");
                    else if(left.ty != NULL && right.ty == NULL)
                        EM_error(e -> pos, "Right operand does not have a type.");
                    if(left.ty == NULL && right.ty == NULL)
                        EM_error(e -> pos, "Both operand do not have a type.");
                }
            }
            if(oper == A_minusOp)
            {
                if(left.ty != NULL && right.ty != NULL)
                {
                    if(left.ty->kind == Ty_int && right.ty -> kind == Ty_int)
                        return expTy(NULL, Ty_Int());
                    if(left.ty -> kind == Ty_real && right.ty -> kind == Ty_int || 
                        left.ty -> kind == Ty_int && right.ty -> kind == Ty_real || 
                        left.ty -> kind == Ty_real && right.ty -> kind == Ty_real)
                        return expTy(NULL, Ty_Real());
                    if(left.ty -> kind == Ty_string && right.ty -> kind == Ty_string)
                        return expTy(NULL, Ty_String());
                    else
                        EM_error(e -> u.op.left -> pos, "The two operands cannot be subtracted.");
                }
                else 
                {
                    if(left.ty == NULL && right.ty != NULL)
                        EM_error(e -> pos, "Left operand does not have a type.");
                    else if(left.ty != NULL && right.ty == NULL)
                        EM_error(e -> pos, "Right operand does not have a type.");
                    if(left.ty == NULL && right.ty == NULL)
                        EM_error(e -> pos, "Both operand do not have a type.");
                }
            }
            if(oper == A_timesOp)
            {
                if(left.ty != NULL && right.ty != NULL)
                {
                    if(left.ty->kind == Ty_int && right.ty -> kind == Ty_int)
                        return expTy(NULL, Ty_Int());
                    if(left.ty -> kind == Ty_real && right.ty -> kind == Ty_int || 
                        left.ty -> kind == Ty_int && right.ty -> kind == Ty_real || 
                        left.ty -> kind == Ty_real && right.ty -> kind == Ty_real)
                        return expTy(NULL, Ty_Real());
                    if(left.ty -> kind == Ty_string && right.ty -> kind == Ty_string)
                        return expTy(NULL, Ty_String());
                    else
                        EM_error(e -> u.op.left -> pos, "The two operands cannot be multiplied.");
                }
                else 
                {
                    if(left.ty == NULL && right.ty != NULL)
                        EM_error(e -> pos, "Left operand does not have a type.");
                    else if(left.ty != NULL && right.ty == NULL)
                        EM_error(e -> pos, "Right operand does not have a type.");
                    if(left.ty == NULL && right.ty == NULL)
                        EM_error(e -> pos, "Both operand do not have a type.");
                }
            }
            if(oper == A_divideOp)
            {
                if(left.ty != NULL && right.ty != NULL)
                {
                    if(left.ty->kind == Ty_int && right.ty -> kind == Ty_int)
                        return expTy(NULL, Ty_Int());
                    if(left.ty -> kind == Ty_real && right.ty -> kind == Ty_int || 
                        left.ty -> kind == Ty_int && right.ty -> kind == Ty_real || 
                        left.ty -> kind == Ty_real && right.ty -> kind == Ty_real)
                        return expTy(NULL, Ty_Real());
                    if(left.ty -> kind == Ty_string && right.ty -> kind == Ty_string)
                        return expTy(NULL, Ty_String());
                    else
                    {
                        EM_error(e -> u.op.left -> pos, "The two operands cannot be divided.");
                        return expTy(NULL, NULL);
                    }
                }
                else 
                {
                    if(left.ty == NULL && right.ty != NULL)
                        EM_error(e -> pos, "Left operand does not have a type.");
                    else if(left.ty != NULL && right.ty == NULL)
                        EM_error(e -> pos, "Right operand does not have a type.");
                    if(left.ty == NULL && right.ty == NULL)
                        EM_error(e -> pos, "Both operand do not have a type.");
                }
            }
            if(oper == A_eqOp)
            {
                if(left.ty != NULL && right.ty != NULL)
                {
                    if(left.ty -> kind != right.ty -> kind)
                        EM_error(e -> u.op.left -> pos, "The two operands cannot be compared.");
                    return expTy(NULL, Ty_Bool());
                }
                else 
                {
                    if(left.ty == NULL && right.ty != NULL)
                        EM_error(e -> pos, "Left operand does not have a type.");
                    else if(left.ty != NULL && right.ty == NULL)
                        EM_error(e -> pos, "Right operand does not have a type.");
                    if(left.ty == NULL && right.ty == NULL)
                        EM_error(e -> pos, "Both operand do not have a type.");
                }
            }
            if(oper == A_neqOp)
            {
                if(left.ty != NULL && right.ty != NULL)
                {
                    if(left.ty -> kind != right.ty -> kind)
                        EM_error(e -> u.op.left -> pos, "The two operands cannot be compared.");
                    return expTy(NULL, Ty_Bool());
                }
                else 
                {
                    if(left.ty == NULL && right.ty != NULL)
                        EM_error(e -> pos, "Left operand does not have a type.");
                    else if(left.ty != NULL && right.ty == NULL)
                        EM_error(e -> pos, "Right operand does not have a type.");
                    if(left.ty == NULL && right.ty == NULL)
                        EM_error(e -> pos, "Both operand do not have a type.");
                }
            }
            if(oper == A_leOp)
            {
                if(left.ty != NULL && right.ty != NULL)
                {
                    if(left.ty -> kind != right.ty -> kind)
                        EM_error(e -> u.op.left -> pos, "The two operands cannot be compared.");
                    return expTy(NULL, Ty_Bool());
                }
                else 
                {
                    if(left.ty == NULL && right.ty != NULL)
                        EM_error(e -> pos, "Left operand does not have a type.");
                    else if(left.ty != NULL && right.ty == NULL)
                        EM_error(e -> pos, "Right operand does not have a type.");
                    if(left.ty == NULL && right.ty == NULL)
                        EM_error(e -> pos, "Both operand do not have a type.");
                }
            }
            if(oper == A_leOp)
            {
                if(left.ty != NULL && right.ty != NULL)
                {
                    if(left.ty -> kind != right.ty -> kind)
                        EM_error(e -> u.op.left -> pos, "The two operands cannot be compared.");
                    return expTy(NULL, Ty_Bool());
                }
                else 
                {
                    if(left.ty == NULL && right.ty != NULL)
                        EM_error(e -> pos, "Left operand does not have a type.");
                    else if(left.ty != NULL && right.ty == NULL)
                        EM_error(e -> pos, "Right operand does not have a type.");
                    if(left.ty == NULL && right.ty == NULL)
                        EM_error(e -> pos, "Both operand do not have a type.");
                }
            }
            if(oper == A_geOp)
            {
                if(left.ty != NULL && right.ty != NULL)
                {
                    if(left.ty -> kind != right.ty -> kind)
                        EM_error(e -> u.op.left -> pos, "The two operands cannot be compared.");
                    return expTy(NULL, Ty_Bool());
                }
                else 
                {
                    if(left.ty == NULL && right.ty != NULL)
                        EM_error(e -> pos, "Left operand does not have a type.");
                    else if(left.ty != NULL && right.ty == NULL)
                        EM_error(e -> pos, "Right operand does not have a type.");
                    if(left.ty == NULL && right.ty == NULL)
                        EM_error(e -> pos, "Both operand do not have a type.");
                }
            }
            if(oper == A_gtOp)
            {
                if(left.ty != NULL && right.ty != NULL)
                {
                    if(left.ty -> kind != right.ty -> kind)
                        EM_error(e -> u.op.left -> pos, "The two operands cannot be compared.");
                    return expTy(NULL, Ty_Bool());
                }
                else 
                {
                    if(left.ty == NULL && right.ty != NULL)
                        EM_error(e -> pos, "Left operand does not have a type.");
                    else if(left.ty != NULL && right.ty == NULL)
                        EM_error(e -> pos, "Right operand does not have a type.");
                    if(left.ty == NULL && right.ty == NULL)
                        EM_error(e -> pos, "Both operand do not have a type.");
                }
            }
            break;
        }
    }
}

void transDec(S_table venv, S_table tenv, A_dec d)
{
    switch(d -> kind)
    {
        case A_varDec:
        {
            struct expty exp;
            E_enventry varEntry = S_look(venv, d -> u.var.var -> u.simple);
            E_enventry typeEntry = S_look(tenv, d -> u.var.var -> u.simple);
            if(varEntry != NULL)
            {
                debug(d -> pos, "Variable or function of name %s is already declared.", S_name(d -> u.var.var -> u.simple));
            }
            if(typeEntry != NULL)
            {
                EM_error(d -> pos, "Type of name %s is already declared.", S_name(d -> u.var.var -> u.simple));
            }
            if(d -> u.var.init != NULL)
            {
                exp = transExp(venv, tenv, d -> u.var.init);
                if(actual_ty(checkSymType(d -> u.var.typ)) != actual_ty(exp.ty)) 
                {
                    EM_error(d -> pos, "Cannot initialize variable of type \'%s\' with \'%s\'.", S_name(d -> u.var.typ), S_name(returnSymFromType(exp.ty)));
                }
                debug(d -> pos, "Variable declared with value.\n");
                S_enter(venv, d -> u.var.var -> u.simple, E_VarEntry(exp.ty));
            }
            else if(d -> u.var.init == NULL)
            {
                debug(d -> pos, "Variable declared.\n");
                S_enter(venv, d -> u.var.var -> u.simple, E_VarEntry(checkSymType(d -> u.var.typ)));
            }
            break;
        }
        case A_functionDec:
        {
            debug(d -> pos, "Function declared.");
            A_fundec func = d -> u.function -> head;
            Ty_ty resultType = S_look(tenv, func -> result);
            Ty_tyList paramTypes = makeParamTypeList(tenv, func -> params);
            S_enter(venv, func -> name, E_FuncEntry(paramTypes, resultType));
            S_beginScope(venv);
            S_enter(venv, func -> name, E_FuncEntry(paramTypes, resultType));
            {
                A_fieldList list;
                Ty_tyList typeList;
                for(list = func -> params, typeList = paramTypes; list != NULL && typeList != NULL; list = list -> tail, typeList = typeList -> tail)
                {
                    if(typeList -> head != NULL)
                        S_enter(venv, list -> head -> name, E_VarEntry(typeList -> head));
                }
                if(func -> body != NULL)
                {
                    transStm(venv, tenv, func->body);
                }
                S_endScope(venv);
                break;
            }
        }
        case A_typeDec:
        {
            S_enter(tenv, d -> u.type -> head -> name, transTy(tenv, d -> u.type -> head -> ty));
            break;
        }
    }
}

Ty_ty transTy (S_table tenv, A_ty ty)
{
    switch(ty -> kind)
    {
        case A_nameTy:
        {
            Ty_ty type;
            if(type = checkSymType(ty -> u.name))
            {
                return type;
            }
            else
            {
                type = S_look(tenv, ty -> u.name);
                if(!type)
                {
                    return Ty_Name(ty -> u.name, NULL);
                }
                return type;
            }
        }
    }
}

static Ty_ty actual_ty(Ty_ty ty)
{
    if(ty ->kind == Ty_name)
    {
        return actual_ty(ty -> u.name.ty);
    }
    return ty;
}

static Ty_tyList makeParamTypeList(S_table tenv, A_fieldList params)
{
    if(params == NULL)
    {
        return NULL;
    }
    Ty_tyList typeList = Ty_TyList(NULL, NULL);
    //make typeList_head point to typeList
    Ty_tyList typeList_head = typeList;
    S_symbol sym;
    Ty_ty ty;
    for(;params != NULL; params = params -> tail)
    {
        sym = params -> head -> typ; 
        if(ty = checkSymType(sym))
        {
            typeList -> head = ty;
        }
        else
        {
            ty = S_look(tenv, sym);
            if(ty != NULL)
            {
                typeList -> head = ty;
            }
            else
            {
                EM_error(params -> head -> pos, "Undefined Type: %s", S_name(sym));
            }
        }
        typeList-> tail = Ty_TyList(NULL, NULL);
        typeList -> head = ty;
        typeList = typeList -> tail;
    }
    typeList -> tail = NULL;
    return typeList_head;
}

static Ty_ty checkSymType(S_symbol sym)
{
    if(sym == S_Symbol("int"))
    {
        return Ty_Int();
    }
    else if(sym == S_Symbol("string"))
    {
        return Ty_String();
    }
    else if(sym == S_Symbol("real"))
    {
        return Ty_Real();
    }
    else if(sym == S_Symbol("bool"))
    {
        return Ty_Bool();
    }
    else if(sym == S_Symbol("void"))
    {
        return Ty_Void();
    }
    else
    {
        return NULL;
    }
}

static S_symbol returnSymFromType(Ty_ty type)
{
    if(type -> kind == Ty_nil)
    {
        return S_Symbol("null");
    }
    else if(type -> kind == Ty_int)
    {
        return S_Symbol("int");
    }
    else if(type -> kind == Ty_real)
    {
        return S_Symbol("real");
    }
    else if(type -> kind == Ty_bool)
    {
        return S_Symbol("bool");
    }
    else if(type -> kind == Ty_string)
    {
        return S_Symbol("string");
    }
    else if(type -> kind == Ty_void)
    {
        return S_Symbol("void");
    }
    else if(type -> kind == Ty_name)
    {
        return type -> u.name.sym;
    }
}