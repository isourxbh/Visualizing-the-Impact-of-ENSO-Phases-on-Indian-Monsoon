# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "huggingface_hub",
# ]
# ///

import os
import getpass
from huggingface_hub import snapshot_download, login

def main():
    repo_id = "Chronos19/IndianMonsoon_ENSO_Impact"
    local_dir = "data"

    print("Hugging Face Authentication Required to avoid rate limits.")
    token = os.environ.get("HF_TOKEN")
    
    if not token:
        print("No HF_TOKEN environment variable found.")
        print("Please enter your Hugging Face access token (you can generate one at https://huggingface.co/settings/tokens).")
        token = getpass.getpass("Token: ")
        
    if not token.strip():
        print("Error: No token provided. Exiting.")
        return

    # Authenticate with Hugging Face
    login(token=token.strip())

    print(f"\nDownloading dataset '{repo_id}' from Hugging Face...")
    
    # This will download the entire dataset and place it in the 'data' directory
    snapshot_download(
        repo_id=repo_id,
        repo_type="dataset",
        local_dir=local_dir,
    )
    
    print(f"\n✅ Download complete! Data is now available in the '{local_dir}/' folder.")

if __name__ == "__main__":
    main()
