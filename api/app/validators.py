def validate_prompt(prompt: str) -> str:
    if not prompt:
        raise ValueError("prompt cannot be empty")
    return prompt
