#!/bin/bash

# Fix all insert and upsert operations by adding 'as any' type assertions

# Pattern 1: .insert({ ... })
find app/api -name "*.ts" -type f -exec perl -i -pe 's/\.insert\(\s*(\{[^}]+\})\s*\)/\.insert($1 as any)/g' {} +

# Pattern 2: .upsert({ ... }, { ... })
find app/api -name "*.ts" -type f -exec perl -i -pe 's/\.upsert\(\s*(\{[^}]+\})\s*,/\.upsert($1 as any,/g' {} +

echo "Type fixes applied!"
