p4patch
--------

Generate patch via "p4" command line for Perforce.  "p4 diff" ignores newly added files, this
utility includes new files in the patch.

Ensure that 'p4' can run successfully in the terminal, then go to the working p4v local folder, 
just run:

    p4patch
    
or
    
    p4patch > patch.txt
    
You can cherry pick the containing folders by running p4patch in different folders and
then concatenate the output in a single patch file.  For example:

    cd /project1
    p4patch > /documents/mypatch.txt
    
    cd /project2
    p4patch >> /documents/mypatch.txt
    
    cd /project3
    p4patch >> /documents/mypatch.txt
