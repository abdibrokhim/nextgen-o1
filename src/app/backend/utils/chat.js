export const chatCompletion = async (prompt, replyText) => {
  console.log("loading chatCompletion...");

  const systemPrompt = "You are a helpful assistant that provides useful information to people in need. Your answer should be concise and informative.";

  try {
        const response = await fetch("https://api.aimlapi.com/chat/completions", {
            method: "POST",
            headers: {
                Authorization: "Bearer ",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt,
                    },
                    {
                        role: "user",
                        content: "[QUOTE]"+replyText+"\n\n[QUERY]"+prompt,
                    },
                ],
                max_tokens: 512,
            }),
        });

        const data = await response.json();

        console.log("data: ", data);

        console.log("data.choices[0].message.content: ", data.choices[0].message.content);

        // Return the assistant's message content
        return data.choices[0].message.content;
    } catch (error) {
        console.error("Error fetching the data:", error);
        return "An error occurred while fetching the data.";
    }
}

// text usage

// chatCompletion("could you tell me about adversarial attacks a little bit?", "Future research in DL may focus on enhancing model interpretability, incorporating domain-specific knowledge to improve model accuracy, and tackling challenges like adversarial attacks.").then(console.log);