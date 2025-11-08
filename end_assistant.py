import json

input_path = "feel_better.jsonl"
output_path = "feel_better_cleaned.jsonl"

with open(input_path, "r", encoding="utf-8") as infile, open(output_path, "w", encoding="utf-8") as outfile:
    for line in infile:
        data = json.loads(line)
        if "messages" in data and len(data["messages"]) > 0:
            # Check if the last message is from the user
            if data["messages"][-1]["role"] == "user":
                data["messages"].pop()  # remove last user message
        # Only write conversations that still have messages
        if data.get("messages"):
            json.dump(data, outfile, ensure_ascii=False)
            outfile.write("\n")

print("✅ Cleaned file saved as finetune_soda_50_cleaned.jsonl")