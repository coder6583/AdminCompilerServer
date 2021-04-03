#include "env.h"

E_enventry E_VarEntry(Ty_ty ty)
{
    E_enventry p = checked_malloc(sizeof(*p));
    p -> kind = E_varentry;
    p -> u.var.ty = ty;
    return p;
}
E_enventry E_FuncEntry(Ty_tyList params, Ty_ty result)
{
    E_enventry p = checked_malloc(sizeof(*p));
    p -> kind = E_funcentry;
    p -> u.func.formals = params;
    p -> u.func.result = result;
    return p;
}

//default types
S_table E_base_tenv(void)
{

}
//default functions
S_table E_base_fenv(void)
{
    
}