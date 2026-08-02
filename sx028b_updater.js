var fs=require('fs');var path='C:\\Users\\ADMIN\\scoutx-platform\\apps\\web\\src\\components\\investigation\\investigation-workspace.tsx';var old=fs.readFileSync(path+'.bak','utf8');var r=old;

var n=r.replace('import { useState } from " react\;','import { useState, useCallback, useRef } from \react\;');
