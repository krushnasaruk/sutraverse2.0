import os
import subprocess
import math

def run(cmd):
    return subprocess.check_output(cmd, shell=True).decode('utf-8').strip()

def main():
    # Get all changed and untracked files
    status_output = run("git status --porcelain")
    if not status_output:
        print("No changes to commit")
        return

    # Extract file paths, handling renames (R status) which have " -> "
    files = []
    for line in status_output.split('\n'):
        if not line: continue
        # The file path is everything after the first 3 characters
        path = line[3:]
        if ' -> ' in path:
            path = path.split(' -> ')[1]
        
        # Remove quotes if git quoted the path
        if path.startswith('"') and path.endswith('"'):
            path = path[1:-1]
        
        files.append(path)

    # Filter out empty paths
    files = [f for f in files if f]

    num_commits = 17
    
    # We will distribute the files across the 17 commits
    for i in range(num_commits):
        # We must make a commit even if no files are left (use --allow-empty)
        if len(files) == 0:
            os.system('git commit --allow-empty -m "Incremental update (empty)"')
        else:
            # How many files to take for this commit?
            # Remaining files / remaining commits
            take = math.ceil(len(files) / (num_commits - i))
            
            chunk = files[:take]
            files = files[take:]
            
            # Add files in chunk
            for f in chunk:
                # Need to use -- if file starts with hyphen, and quote paths with spaces
                os.system(f'git add "{f}"')
            
            os.system(f'git commit -m "Incremental update part {i+1} of {num_commits}"')
            
    print("Pushing to GitHub...")
    os.system("git push")

if __name__ == "__main__":
    main()
