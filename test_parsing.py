import pandas as pd
import re
import ast
from typing import List, Dict, Optional

def parse_speakers(s: str) -> List[str]:
    if s is None:
        return []
    s = s.strip()
    
    if s.startswith("['") and s.endswith("']"):
        inner = s[2:-2]
        inner = inner.replace('\n', '')
        parts = inner.split("' '")
        result = []
        for part in parts:
            part = part.strip()
            if not part:
                continue
            if part.strip():
                result.append(part.strip())
        return result
    
    try:
        val = ast.literal_eval(s)
        if isinstance(val, (list, tuple)):
            return [str(x) for x in val]
    except Exception:
        pass
    
    return [s] if s else []

def parse_dialogue(s: str) -> List[str]:
    if s is None:
        return []
    s = s.strip()
    
    # Try to parse as Python list first
    try:
        val = ast.literal_eval(s)
        if isinstance(val, list):
            # If it's a list with one concatenated string, split it
            if len(val) == 1 and isinstance(val[0], str):
                # Split the concatenated dialogue by sentence boundaries
                text = val[0]
                
                # Split by punctuation followed by capital letters, keeping the punctuation
                parts = re.split(r'([.!?])(?=[A-Z])', text)
                
                # Combine text with punctuation
                result = []
                for i in range(0, len(parts), 2):
                    if i < len(parts):
                        sentence = parts[i]
                        if i + 1 < len(parts):
                            sentence += parts[i + 1]  # Add the punctuation
                        sentence = sentence.strip()
                        if sentence:
                            # Unescape quotes
                            sentence = sentence.replace("\\'", "'").replace('\\"', '"')
                            result.append(sentence)
                
                # Handle the last part if it doesn't end with punctuation + capital
                if len(parts) % 2 == 1:  # Odd number means there's a leftover part
                    last_part = parts[-1].strip()
                    if last_part and last_part not in [r.strip() for r in result]:  # Avoid duplicates
                        # Unescape quotes
                        last_part = last_part.replace("\\'", "'").replace('\\"', '"')
                        result.append(last_part)
                
                return result
            else:
                # It's already a proper list
                return [str(x) for x in val]
    except Exception:
        pass
    
    return [s] if s else []

def build_messages(dialogue: List[str], speakers: List[str]) -> Optional[List[Dict[str, str]]]:
    if not dialogue or not speakers or len(dialogue) != len(speakers):
        print('length mismatch:', len(dialogue), len(speakers))
        return None

    first_speaker = speakers[0] if speakers else None
    if not first_speaker:
        return None

    messages: List[Dict[str, str]] = []
    for sp, text in zip(speakers, dialogue):
        if not isinstance(text, str):
            continue
        role = 'user' if sp == first_speaker else 'assistant'
        content = re.sub(r'\s+\n', '\n', text.strip())
        if content:
            messages.append({'role': role, 'content': content})

    collapsed: List[Dict[str, str]] = []
    for m in messages:
        if collapsed and collapsed[-1]['role'] == m['role']:
            collapsed[-1]['content'] = (collapsed[-1]['content'] + '\n' + m['content']).strip()
        else:
            collapsed.append(m)

    roles_present = {m['role'] for m in collapsed}
    if not {'user', 'assistant'}.issubset(roles_present):
        return None

    return collapsed

# Load and test
df_filtered = pd.read_csv('soda_counseling.csv')
mask = df_filtered['speakers'].str.lower().str.contains('counselor|therapist', na=False)
df_filtered = df_filtered[mask]

sample_row = df_filtered.iloc[6]
test_speakers = parse_speakers(sample_row['speakers'])
test_dialogue = parse_dialogue(sample_row['dialogue'])

print('Test speakers:', test_speakers)
print('Test dialogue:', test_dialogue)
print('Lengths:', len(test_speakers), len(test_dialogue))

test_messages = build_messages(test_dialogue, test_speakers)
if test_messages:
    print('\nGenerated messages:')
    for i, msg in enumerate(test_messages):
        print(f'{i+1}. {msg["role"]}: {msg["content"][:100]}...')
else:
    print('No messages generated')
