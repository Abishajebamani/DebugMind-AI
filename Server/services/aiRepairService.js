const OLLAMA_URL =
  process.env.OLLAMA_URL || "http://localhost:11434/api/generate";

const OLLAMA_MODEL =
  process.env.OLLAMA_MODEL || "qwen2.5-coder:1.5b";


const extractJson = (text) => {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Invalid AI JSON response:");
    console.error(cleaned);

    throw new Error("AI returned invalid JSON.");
  }
};


export const generateAIRepair = async ({
  bugTitle,
  fileName,
  sourceCode,
  oldCode
}) => {

  const prompt = `
You are DebugMind AI, a secure code repair assistant.

Analyze the detected vulnerability and generate a safe minimal code replacement.

BUG TITLE:
${bugTitle}

FILE:
${fileName}

VULNERABLE CODE:
${oldCode}

SOURCE CODE:
${sourceCode}

RULES:

1. Return ONLY valid JSON.
2. Do not return markdown.
3. Do not add explanations outside JSON.
4. The "newCode" field must contain ONLY the replacement code.
5. Do not repeat the old vulnerable code in newCode.
6. Do not use eval().
7. Do not introduce npm packages or dependencies.
8. Keep the repair as small as possible.
9. Do not modify unrelated code.
10. The replacement must work with the surrounding source code.
11. If you cannot confidently generate a safe repair, set canApply to false.
12. confidence must be a number from 0 to 100.

Return exactly:

{
  "canApply": true,
  "newCode": "corrected replacement code",
  "explanation": "short explanation",
  "confidence": 90
}
`;

  try {

    const response = await fetch(OLLAMA_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        model: OLLAMA_MODEL,

        format: {
          type: "object",
          properties: {
            canApply: {
              type: "boolean"
            },
            newCode: {
              type: "string"
            },
            explanation: {
              type: "string"
            },
            confidence: {
              type: "number"
            }
          },
          required: [
            "canApply",
            "newCode",
            "explanation",
            "confidence"
          ]
        },

        prompt,

        stream: false,

        options: {
          temperature: 0.1
        }
      })
    });


    if (!response.ok) {
      throw new Error(
        `Ollama request failed with status ${response.status}`
      );
    }


    const data = await response.json();

    const aiText = data.response;

    if (!aiText) {
      throw new Error("Ollama returned an empty response.");
    }


    const repair = extractJson(aiText);


    const confidence = Math.max(
      0,
      Math.min(
        100,
        Number(repair.confidence) || 0
      )
    );


    const newCode =
      typeof repair.newCode === "string"
        ? repair.newCode.trim()
        : "";


    const explanation =
      typeof repair.explanation === "string"
        ? repair.explanation.trim()
        : "AI generated a repair proposal.";


    const canApply =
      repair.canApply === true &&
      newCode.length > 0 &&
      newCode !== oldCode.trim();


    return {
      oldCode: oldCode.trim(),

      newCode: canApply
        ? newCode
        : null,

      explanation,

      confidence,

      canApply
    };

  } catch (error) {

    console.error(
      "Local AI repair error:",
      error.message
    );

    throw error;
  }
};