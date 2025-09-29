

Dataset: ShenLab/MentalChat16K: https://huggingface.co/datasets/ShenLab/MentalChat16K/blob/main/Interview_Data_6K.csv

This dataset consists of 6338 question-answer pairs from 378 interview transcripts. The transcripts are collected from an ongoing clinical trial transcribed by human experts based on audio recordings of behavioral intervention sessions between behavior health coaches and caregivers of individuals in palliative or hospice care

good article that puts the words well for crafting personas for our agents: https://ict.usc.edu/news/essays/on-crafting-personalities-with-code-iva-25/


Question: how should we build these llm models?
- QLora?
- MoE?
- sideloading? https://www.lesswrong.com/posts/7pCaHHSeEo8kejHPk/sideloading-creating-a-model-of-a-person-via-llm-with-very
- Use reranking from bigger models to fine tune persona that seems consistent. (we do CoT to get consistent responses from sideload, to have fast inference model work well) Useful info on this: https://medium.com/@vineethveetil/crafting-ai-personalities-the-art-of-evaluating-preference-data-for-llms-512cba6bcc2d
    - The cool idea about this too is that we can beforehand specify what we want to see these agents do, then go from there.
    Could we fine-tune chatgpt instead of Qwen?
- GEPA system?


just a stellar read on persona vectors
- https://www.anthropic.com/research/persona-vectors

