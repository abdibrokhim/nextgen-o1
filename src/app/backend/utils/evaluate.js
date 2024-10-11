import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: "",
    dangerouslyAllowBrowser: true,
});

export const evalIt = async (prompt) => {
    const systemPrompt = "Given the response from ChatGPT. If it says that could not fetch real time data return only 0, otherwise 1. You must return sinle digit number.";
  const completion = await openai.chat.completions.create({
    messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
    ],
    model: "gpt-4o",
  });

  console.log('eval: ', completion.choices[0]);
    return completion.choices[0].message.content;
}