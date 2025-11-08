from datasets import load_dataset

# Load the dataset
ds = load_dataset("allenai/soda", split="train")
subset = ds.shuffle(seed=42).select(range(1000))

# Filter examples whose tail exactly equals "pleased"
# pleased_ds = ds.filter(lambda ex: ex["tail"].strip().lower() == "pleased")

# partial matches (e.g., "very pleased", "pleased with herself"):
counseling_ds = subset.filter(lambda ex: "counseling" in ex["narrative"].lower())

unhappy_ds = subset.filter(lambda ex: ex["tail"].strip().lower() == "unhappy")
optimistic_ds = subset.filter(lambda ex: ex["tail"].strip().lower() == "optimistic")

print(len(counseling_ds))
print(counseling_ds[1:10])
