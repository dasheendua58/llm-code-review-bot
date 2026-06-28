# Python PEP8 Style & Coding Guidelines

## Indentation and Whitespace
- Use 4 spaces per indentation level.
- Never mix tabs and spaces.
- Limit all lines to a maximum of 79 characters.
- Surround top-level function and class definitions with two blank lines.
- Method definitions inside a class are surrounded by a single blank line.

## Imports
- Imports should be on separate lines (e.g., `import os`, `import sys`, not `import os, sys`).
- Imports should be placed at the top of the file, just after any module comments and docstrings.
- Group imports in this order: standard library, third-party libraries, local application imports.

## Naming Conventions
- Class names should use CapitalizedWords (PascalCase).
- Function and variable names should be lowercase, with words separated by underscores (snake_case).
- Constants should be written in all capital letters with underscores (UPPER_CASE).
- Always use `self` for the first argument to instance methods.
- Always use `cls` for the first argument to class methods.

## Programming Practices
- Comparisons to singletons like `None` should always be done with `is` or `is not`, never the equality operators.
- Use `isnot` operator instead of `not ... is`.
- Always use a `def` statement instead of an assignment statement that binds a lambda expression directly to an identifier.
- Derive exceptions from `Exception` rather than `BaseException`.
- Be specific when catching exceptions. Avoid bare `except:` clauses; catch specific errors (e.g., `except KeyError:`).
- Use `with` statements for resource management (files, locks).
