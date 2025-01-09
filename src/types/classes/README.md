# Class Interfaces

To properly adhere to the Dependency Inversion (DI) principle, this folder (and its subfolders) contain interfaces/contracts for the various class implementations found in the project.  
This ensures we can achieve low coupling between classes and their dependencies as well as easy testability (coming soonTM).

## Creating a new subfolder

This should be done when creating an interface of which falls in to a class category that doesn't yet exist as a subfolder.

Examples of class categories are:

-   controllers
-   modules
-   clients
    etc.

The actually classes can be found in these categories as folders located relative to the project `/src` directory and as such, the interface subfolders should be created with the same structure (e.g. `/src/modules/coommands.ts` -> `./modules/commands.ts`).  
Notice the direction the arrow is pointing - this is the main idea behind DI. Read more [here](https://github.com/inversify/InversifyJS/blob/master/wiki/oo_design.md).

## Creating a new interface

To create a new interface, simply create a new file in the class category subfolder it belongs to (relative to the project `src` directory) with the name of the class you want to create an interface for.

## A note about method descriptions

When creating a new interface, make sure to add a JSDoc description for each method.

-   If it's a public method, the JSDoc comment should be added in the interface file.
-   If it's a private method, the JSDoc comment should be added in the class file (since `private` methods aren't "contracted" in interfaces).
