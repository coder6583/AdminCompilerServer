#pragma once
#include "util.h"
extern bool EM_anyErrors;

void EM_newLine(void);

extern int EM_tokPos;

void EM_error(int, string, ...);
void debug(int, string, ...);
void EM_impossible(string, ...);
void EM_reset(string filename);